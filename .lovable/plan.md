

## Plan: 用户邀请 + 临时密码 + 管理员重置 + 首次登录强制改密

### 概要
重构邀请流程：管理员创建用户时直接生成临时密码（不通过邮件），前端显示一次并提供复制按钮。用户首次用临时密码登录后强制修改密码。管理员可编辑用户属性和重置密码。添加审计日志表。

---

### 1. DB 迁移

- `profiles` 表新增 `must_change_password boolean default false` 字段，标记是否需要强制改密
- 新建 `audit_logs` 表：`id, action (text), target_user_id (uuid), performed_by (uuid), details (jsonb), created_at`，RLS 仅 admin 可读，service_role 写入
- profiles 的 UPDATE RLS 保持不变（用户只能改自己），admin 操作通过 Edge Function + service_role 绕过

### 2. 重构 `create-invite` Edge Function

- 保留现有 admin 验证逻辑
- 生成 8 位随机密码：`crypto.getRandomValues` → base62 字符串
- 调用 `admin.createUser({ email, password: tempPassword, email_confirm: true, user_metadata: { name, role, must_change_password: true } })`
- Upsert profiles：`{ id, name, role, daily_rate, hourly_rate, must_change_password: true }`
- 写入 audit_logs：`{ action: 'user_created', target_user_id, performed_by: caller.id }`
- 返回 `{ success, userId, tempPassword }` — 不再返回 magic link
- 移除 `generateLink` 调用

### 3. 新建 `reset-password` Edge Function

- 验证调用者是 admin（同 create-invite 的验证模式）
- 接收 `{ userId }`
- 生成新的 8 位随机密码
- 调用 `admin.updateUserById(userId, { password: newPassword, user_metadata: { must_change_password: true } })`
- 更新 profiles `must_change_password = true`
- 写入 audit_logs：`{ action: 'password_reset', target_user_id, performed_by }`
- 返回 `{ success, tempPassword }`

### 4. 新建 `update-profile-admin` Edge Function

- 验证调用者是 admin
- 接收 `{ userId, name?, role?, daily_rate?, hourly_rate? }`
- 用 service_role 更新 profiles 表（绕过 RLS）
- 写入 audit_logs
- 返回 `{ success }`

### 5. 前端：强制改密逻辑

- `AuthContext`：fetchProfile 后检查 `must_change_password`，若为 true 则在 context 中暴露该状态
- `ProtectedRoute`：若 `profile.must_change_password === true`，重定向到 `/change-password`
- 新建 `/change-password` 页面（或复用 `SetPasswordPage`）：调用 `supabase.auth.updateUser({ password })`，成功后通过 `update-profile-admin` 或直接 client-side 更新 `must_change_password = false`（需调整 RLS 让用户可更新自己的 `must_change_password` 字段 — 已有 UPDATE own policy）

### 6. 前端：重构 `InviteUserPage`

- **邀请区**：提交后显示临时密码弹窗（Dialog），含密码文本 + 复制按钮，关闭后密码消失不可再查看
- **已有用户列表**：每行增加：
  - "编辑" 按钮 → Dialog 修改 name、role、daily_rate、hourly_rate（调用 `update-profile-admin`）
  - "重置密码" 按钮 → 调用 `reset-password`，成功后弹窗显示临时密码 + 复制按钮
- 移除 `accept-invite` 相关 link 逻辑（不再需要 magic link）

### 7. 侧边栏修改密码

- 保留 `ChangePasswordDialog` 在侧边栏现有位置不变（用户要求"不要把修改密码作为单独一项列出"指的是不要单独建页面，现有侧边栏内嵌 Dialog 方式已满足）

### 8. `AcceptInvitePage` 简化

- 保留页面但简化：用户现在直接用临时密码登录即可，首次登录后被强制改密
- 此页面可作为备用入口，但主流程不再依赖它

---

### 文件变更清单

| 文件 | 操作 |
|------|------|
| `supabase/migrations/new.sql` | 新增 must_change_password 字段 + audit_logs 表 |
| `supabase/functions/create-invite/index.ts` | 重构：生成临时密码，移除 magic link |
| `supabase/functions/reset-password/index.ts` | 新建：admin 重置密码 |
| `supabase/functions/update-profile-admin/index.ts` | 新建：admin 编辑用户属性 |
| `src/pages/InviteUserPage.tsx` | 重构：显示临时密码、编辑用户、重置密码 |
| `src/context/AuthContext.tsx` | Profile 增加 must_change_password 字段 |
| `src/components/ProtectedRoute.tsx` | 强制改密重定向 |
| `src/pages/ChangePasswordPage.tsx` | 新建：强制改密页面 |
| `src/App.tsx` | 添加 /change-password 路由 |

