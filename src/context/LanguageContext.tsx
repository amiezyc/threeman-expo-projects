import React, { createContext, useContext, useState, useCallback } from 'react';

export type Language = 'zh' | 'en';

const translations = {
  // App name
  'app.title': { zh: '展台管理系统', en: 'Booth Builder Pro' },
  'app.subtitle': { zh: 'Booth Builder Pro', en: 'Management System' },

  // Auth
  'auth.email': { zh: '邮箱', en: 'Email' },
  'auth.password': { zh: '密码', en: 'Password' },
  'auth.login': { zh: '登录', en: 'Login' },
  'auth.inviteOnly': { zh: '仅限受邀用户登录', en: 'Invite-only access' },
  'auth.newPassword': { zh: '新密码', en: 'New Password' },
  'auth.confirmPassword': { zh: '确认密码', en: 'Confirm Password' },
  'auth.changePassword': { zh: '修改密码', en: 'Change Password' },
  'auth.confirmChange': { zh: '确认修改', en: 'Confirm' },
  'auth.confirm': { zh: '确认', en: 'Confirm' },
  'auth.setPassword': { zh: '设置密码', en: 'Set Password' },
  'auth.setPasswordDesc': { zh: '请设置你的登录密码', en: 'Please set your login password' },
  'auth.setPasswordInviteDesc': { zh: '请设置你的登录密码以完成注册', en: 'Set your password to complete registration' },
  'auth.mustChangePassword': { zh: '您需要设置新密码后才能继续使用系统', en: 'You must set a new password to continue' },
  'auth.passwordMismatch': { zh: '两次密码不一致', en: 'Passwords do not match' },
  'auth.passwordTooShort': { zh: '密码至少6位', en: 'Password must be at least 6 characters' },
  'auth.passwordChanged': { zh: '密码已修改，请重新登录', en: 'Password changed, please login again' },
  'auth.passwordSet': { zh: '密码设置成功', en: 'Password set successfully' },
  'auth.passwordSetLogin': { zh: '密码设置成功，已自动登录', en: 'Password set, logged in automatically' },
  'auth.passwordSetPleaseLogin': { zh: '密码设置成功，请登录', en: 'Password set, please login' },
  'auth.loginFailed': { zh: '登录失败', en: 'Login failed' },
  'auth.changeFailed': { zh: '修改失败', en: 'Change failed' },
  'auth.setFailed': { zh: '设置密码失败', en: 'Failed to set password' },
  'auth.invalidInvite': { zh: '无效的邀请链接', en: 'Invalid invitation link' },
  'auth.backToLogin': { zh: '返回登录', en: 'Back to Login' },
  'auth.acceptInviteFailed': { zh: '接受邀请失败', en: 'Failed to accept invitation' },
  'auth.signOut': { zh: '退出登录', en: 'Sign Out' },

  // Sidebar nav
  'nav.overview': { zh: '总览', en: 'Overview' },
  'nav.projects': { zh: '项目管理', en: 'Projects' },
  'nav.payments': { zh: '收款追踪', en: 'Payments' },
  'nav.employees': { zh: '员工管理', en: 'Employees' },
  'nav.users': { zh: '用户管理', en: 'Users' },
  'nav.myDashboard': { zh: '我的', en: 'My Dashboard' },
  'nav.user': { zh: '用户', en: 'User' },
  'nav.admin': { zh: '管理员', en: 'Admin' },
  'nav.employee': { zh: '员工', en: 'Employee' },

  // Dashboard
  'dashboard.title': { zh: '总览', en: 'Overview' },
  'dashboard.subtitle': { zh: '所有项目的财务概况', en: 'Financial overview of all projects' },
  'dashboard.totalContract': { zh: '合同总额', en: 'Total Contract' },
  'dashboard.totalExpenses': { zh: '总支出', en: 'Total Expenses' },
  'dashboard.estimatedProfit': { zh: '预计利润', en: 'Est. Profit' },
  'dashboard.profitMargin': { zh: '利润率', en: 'Margin' },
  'dashboard.pendingPayment': { zh: '待收款', en: 'Pending' },
  'dashboard.received': { zh: '已收', en: 'Received' },
  'dashboard.projectExpenses': { zh: '项目开销', en: 'Project Expenses' },
  'dashboard.thirdPartyExpenses': { zh: '三方费用', en: '3rd Party Costs' },
  'dashboard.noThirdParty': { zh: '暂无三方费用', en: 'No 3rd party costs yet' },

  // Projects page
  'projects.title': { zh: '项目管理', en: 'Project Management' },
  'projects.subtitle': { zh: '查看每个项目和展位的详细信息', en: 'View details of each project and booth' },
  'projects.newProject': { zh: '新建项目', en: 'New Project' },
  'projects.projectName': { zh: '项目名称', en: 'Project Name' },
  'projects.startDate': { zh: '开始日期', en: 'Start Date' },
  'projects.created': { zh: '项目已创建', en: 'Project created' },
  'projects.deleted': { zh: '项目已删除', en: 'Project deleted' },
  'projects.noProjects': { zh: '暂无项目，点击"新建项目"开始', en: 'No projects yet, click "New Project" to start' },
  'projects.all': { zh: '全部', en: 'All' },
  'projects.allExpenses': { zh: '全部开销', en: 'All Expenses' },
  'projects.contractAmount': { zh: '合同金额', en: 'Contract Amount' },
  'projects.contractUpdated': { zh: '合同金额已更新', en: 'Contract amount updated' },
  'projects.profit': { zh: '利润', en: 'Profit' },
  'projects.thirdPartyCosts': { zh: '三方费用', en: '3rd Party Costs' },
  'projects.sharedCosts': { zh: '分摊公共费用', en: 'Shared Costs' },
  'projects.sharedCostsDetail': { zh: '分摊公共费用明细', en: 'Shared Cost Breakdown' },
  'projects.boothProfit': { zh: '展位利润', en: 'Booth Profit' },
  'projects.ratio': { zh: '占比', en: 'Ratio' },
  'projects.noThirdParty': { zh: '暂无三方费用', en: 'No 3rd party costs yet' },

  // Booth
  'booth.add': { zh: '添加展位', en: 'Add Booth' },
  'booth.clientName': { zh: '客户名称', en: 'Client Name' },
  'booth.contractAmount': { zh: '合同金额 ($)', en: 'Contract Amount ($)' },
  'booth.added': { zh: '展位已添加', en: 'Booth added' },
  'booth.deleted': { zh: '展位已删除', en: 'Booth deleted' },

  // Partners
  'partners.title': { zh: '合伙人', en: 'Partners' },
  'partners.edit': { zh: '编辑合伙人', en: 'Edit Partners' },
  'partners.add': { zh: '添加合伙人', en: 'Add Partner' },
  'partners.updated': { zh: '合伙人已更新', en: 'Partners updated' },
  'partners.name': { zh: '姓名', en: 'Name' },
  'partners.profitSharing': { zh: '利润分配', en: 'Profit Sharing' },
  'partners.totalProfit': { zh: '总利润', en: 'Total Profit' },

  // Payments page
  'payments.title': { zh: '收款追踪', en: 'Payment Tracking' },
  'payments.subtitle': { zh: '管理所有客户的收款进度', en: 'Track payment progress for all clients' },
  'payments.addPayment': { zh: '添加款项', en: 'Add Payment' },
  'payments.addRecord': { zh: '添加收款记录', en: 'Add Payment Record' },
  'payments.totalAmount': { zh: '总金额', en: 'Total Amount' },
  'payments.received': { zh: '已收款', en: 'Received' },
  'payments.pending': { zh: '待收款', en: 'Pending' },
  'payments.allReceived': { zh: '全部已收', en: 'All Received' },
  'payments.deposit': { zh: '首款 (Deposit)', en: 'Deposit' },
  'payments.balance': { zh: '尾款 (Balance)', en: 'Balance' },
  'payments.depositShort': { zh: '首款', en: 'Deposit' },
  'payments.balanceShort': { zh: '尾款', en: 'Balance' },
  'payments.status.pending': { zh: '待处理', en: 'Pending' },
  'payments.status.invoiced': { zh: '已开票', en: 'Invoiced' },
  'payments.status.received': { zh: '已收款', en: 'Received' },
  'payments.statusChanged': { zh: '状态已更改为', en: 'Status changed to' },
  'payments.dateUpdated': { zh: '日期已更新', en: 'Date updated' },
  'payments.setDate': { zh: '点击设置日期', en: 'Click to set date' },
  'payments.invoiceDate': { zh: 'Invoice 日期', en: 'Invoice Date' },
  'payments.notes': { zh: '备注', en: 'Notes' },
  'payments.notesPlaceholder': { zh: '备注信息', en: 'Payment notes' },
  'payments.selectBooth': { zh: '选择展位', en: 'Select Booth' },
  'payments.type': { zh: '类型', en: 'Type' },
  'payments.amount': { zh: '金额 ($)', en: 'Amount ($)' },
  'payments.status': { zh: '状态', en: 'Status' },
  'payments.saved': { zh: '款项已添加', en: 'Payment added' },
  'payments.selectBoothAmount': { zh: '请选择展位并填写金额', en: 'Please select booth and enter amount' },
  'payments.viewContract': { zh: '查看合同', en: 'View Contract' },
  'payments.editPayment': { zh: '编辑款项', en: 'Edit Payment' },
  'payments.fillAmount': { zh: '请填写金额', en: 'Please enter amount' },
  'payments.receivedAmount': { zh: '已收', en: 'Received' },
  'payments.pendingAmount': { zh: '待收', en: 'Pending' },

  // Upload / AI
  'upload.contract': { zh: '上传合同/Invoice', en: 'Upload Contract/Invoice' },
  'upload.selectFile': { zh: '选择文件', en: 'Select File' },
  'upload.uploading': { zh: '上传中...', en: 'Uploading...' },
  'upload.uploaded': { zh: '文件已上传', en: 'File uploaded' },
  'upload.uploadFailed': { zh: '上传失败', en: 'Upload failed' },
  'upload.view': { zh: '查看', en: 'View' },
  'upload.receipt': { zh: '上传收据图片', en: 'Upload receipt image' },
  'upload.receiptLabel': { zh: '收据/Receipt', en: 'Receipt' },
  'ai.recognize': { zh: '识别', en: 'Recognize' },
  'ai.recognizing': { zh: 'AI识别中...', en: 'AI recognizing...' },
  'ai.recognized': { zh: 'AI识别完成，请确认信息后保存', en: 'AI recognized, please confirm and save' },
  'ai.recognizeFailed': { zh: 'AI识别失败，请手动填写', en: 'AI recognition failed, fill manually' },
  'ai.autoRecognize': { zh: '上传后AI自动识别', en: 'AI auto-recognizes after upload' },
  'ai.receiptRecognized': { zh: 'AI已自动识别收据内容', en: 'AI auto-recognized receipt' },
  'ai.receiptFailed': { zh: '收据识别失败，请手动填写', en: 'Receipt recognition failed, fill manually' },
  'ai.uploadFirst': { zh: '请先上传文件', en: 'Please upload a file first' },

  // Employees page
  'employees.title': { zh: '员工管理', en: 'Employee Management' },
  'employees.subtitle': { zh: '员工工时和开销汇总（通过用户管理添加员工）', en: 'Work hours and expense summary (add employees via Users)' },
  'employees.totalCount': { zh: '员工总数', en: 'Total Employees' },
  'employees.totalLaborCost': { zh: '人工总费用', en: 'Total Labor Cost' },
  'employees.name': { zh: '姓名', en: 'Name' },
  'employees.role': { zh: '角色', en: 'Role' },
  'employees.dailyRate': { zh: '日薪', en: 'Daily Rate' },
  'employees.workDays': { zh: '工作天数', en: 'Work Days' },
  'employees.laborTotal': { zh: '人工费合计', en: 'Labor Total' },
  'employees.advancedExpenses': { zh: '垫付开销', en: 'Out-of-pocket' },
  'employees.days': { zh: '天', en: 'd' },
  'employees.workLogTitle': { zh: '工时记录', en: 'Work Log' },
  'employees.noWorkLog': { zh: '暂无工时记录', en: 'No work logs yet' },
  'employees.addWorkLog': { zh: '添加工时', en: 'Add Work Log' },
  'employees.workLogUpdated': { zh: '工时已更新', en: 'Work log updated' },
  'employees.workLogDeleted': { zh: '工时已删除', en: 'Work log deleted' },
  'employees.workLogAdded': { zh: '已添加', en: 'Added' },
  'employees.daysAdded': { zh: '天工时', en: 'day(s) of work' },
  'employees.project': { zh: '项目', en: 'Project' },
  'employees.date': { zh: '日期', en: 'Date' },
  'employees.billingType': { zh: '计费方式', en: 'Billing Type' },
  'employees.daily': { zh: '日薪', en: 'Daily' },
  'employees.hourly': { zh: '时薪', en: 'Hourly' },
  'employees.dailyRateLabel': { zh: '日薪 ($/天)', en: 'Daily Rate ($/day)' },
  'employees.hourlyRateLabel': { zh: '时薪 ($/hr)', en: 'Hourly Rate ($/hr)' },
  'employees.hours': { zh: '小时数', en: 'Hours' },
  'employees.selectDates': { zh: '选择工作日期（可多选）', en: 'Select work dates (multi-select)' },
  'employees.selectedDays': { zh: '已选择', en: 'Selected' },
  'employees.perDay': { zh: '/天', en: '/day' },
  'employees.perHour': { zh: '/hr', en: '/hr' },
  'employees.editEmployee': { zh: '编辑员工', en: 'Edit Employee' },
  'employees.addEmployee': { zh: '添加员工', en: 'Add Employee' },
  'employees.employeeName': { zh: '员工姓名', en: 'Employee name' },
  'employees.dailyPay': { zh: '每天工资', en: 'Daily pay' },
  'employees.hourlyPay': { zh: '每小时工资（可选）', en: 'Hourly pay (optional)' },
  'employees.autoSaved': { zh: '已自动保存', en: 'Auto saved' },
  'employees.employeeAdded': { zh: '员工已添加', en: 'Employee added' },

  // Work log page (employee)
  'worklog.title': { zh: '工时记录', en: 'Work Log' },
  'worklog.subtitle': { zh: '记录你的工作天数', en: 'Record your work days' },
  'worklog.totalDays': { zh: '总工作天数', en: 'Total Work Days' },
  'worklog.totalPay': { zh: '应得工资', en: 'Total Pay' },
  'worklog.addLog': { zh: '添加工时', en: 'Add Work Log' },
  'worklog.selectProject': { zh: '选择项目', en: 'Select project' },
  'worklog.recordLog': { zh: '记录工时', en: 'Record' },
  'worklog.submitting': { zh: '提交中...', en: 'Submitting...' },
  'worklog.history': { zh: '工时历史', en: 'Work History' },
  'worklog.noLogs': { zh: '暂无工时记录', en: 'No work logs yet' },
  'worklog.editLog': { zh: '编辑工时', en: 'Edit Work Log' },

  // Expenses
  'expenses.myExpenses': { zh: '我的开销', en: 'My Expenses' },
  'expenses.myExpensesSubtitle': { zh: '提交和查看你的开销记录', en: 'Submit and view your expense records' },
  'expenses.myExpensesTotal': { zh: '我的开销 — 合计', en: 'My Expenses — Total' },
  'expenses.noExpenses': { zh: '暂无开销记录', en: 'No expenses yet' },
  'expenses.addExpense': { zh: '添加开销', en: 'Add Expense' },
  'expenses.editExpense': { zh: '编辑开销', en: 'Edit Expense' },
  'expenses.date': { zh: '日期', en: 'Date' },
  'expenses.mainCategory': { zh: '大类', en: 'Category' },
  'expenses.subCategory': { zh: '小类', en: 'Sub-category' },
  'expenses.booth': { zh: '展位', en: 'Booth' },
  'expenses.selectBooth': { zh: '选择展位', en: 'Select booth' },
  'expenses.amount': { zh: '金额 ($)', en: 'Amount ($)' },
  'expenses.description': { zh: '说明', en: 'Description' },
  'expenses.descriptionPlaceholder': { zh: '开销说明...', en: 'Expense description...' },
  'expenses.submit': { zh: '提交', en: 'Submit' },
  'expenses.payer': { zh: '支付人', en: 'Paid by' },
  'expenses.items': { zh: '笔', en: 'items' },
  'expenses.reimbursed': { zh: '已收', en: 'Reimbursed' },
  'expenses.unreimbursed': { zh: '未收', en: 'Unreimbursed' },
  'expenses.reimbursedFull': { zh: '已收款', en: 'Reimbursed' },
  'expenses.unreimbursedFull': { zh: '未收款', en: 'Unreimbursed' },
  'expenses.pendingReimburse': { zh: '待收', en: 'Pending' },
  'expenses.reimbursedTip': { zh: '已收款 (点击切换)', en: 'Reimbursed (click to toggle)' },
  'expenses.unreimbursedTip': { zh: '未收款 (点击切换)', en: 'Unreimbursed (click to toggle)' },
  'expenses.saveFailed': { zh: '保存失败', en: 'Save failed' },

  // Employee dashboard tabs
  'employeeDash.expenses': { zh: '我的开销', en: 'My Expenses' },
  'employeeDash.worklog': { zh: '工时记录', en: 'Work Log' },

  // Users / Invite
  'users.title': { zh: '用户管理', en: 'User Management' },
  'users.subtitle': { zh: '邀请新用户、编辑属性、重置密码', en: 'Invite users, edit profiles, reset passwords' },
  'users.inviteNew': { zh: '邀请新用户', en: 'Invite New User' },
  'users.name': { zh: '姓名', en: 'Name' },
  'users.email': { zh: '邮箱', en: 'Email' },
  'users.role': { zh: '角色', en: 'Role' },
  'users.dailyRate': { zh: '日薪', en: 'Daily Rate' },
  'users.hourlyRate': { zh: '时薪', en: 'Hourly Rate' },
  'users.hourlyOptional': { zh: '可选', en: 'Optional' },
  'users.createUser': { zh: '创建用户', en: 'Create User' },
  'users.existingUsers': { zh: '已有用户', en: 'Existing Users' },
  'users.noUsers': { zh: '暂无用户', en: 'No users yet' },
  'users.edit': { zh: '编辑', en: 'Edit' },
  'users.editUser': { zh: '编辑用户', en: 'Edit User' },
  'users.resetPassword': { zh: '重置密码', en: 'Reset Password' },
  'users.tempPassword': { zh: '临时密码', en: 'Temporary Password' },
  'users.tempPasswordDesc': { zh: '请将此密码发送给用户，密码仅显示一次：', en: 'Send this password to the user. It is shown only once:' },
  'users.tempPasswordNote': { zh: '用户首次登录后将被要求修改密码。', en: 'User will be prompted to change password on first login.' },
  'users.inviteFailed': { zh: '邀请失败', en: 'Invite failed' },
  'users.userCreated': { zh: '已创建用户', en: 'User created' },
  'users.updateFailed': { zh: '更新失败', en: 'Update failed' },
  'users.updated': { zh: '已更新', en: 'Updated' },
  'users.resetFailed': { zh: '重置失败', en: 'Reset failed' },

  // Common
  'common.save': { zh: '保存', en: 'Save' },
  'common.cancel': { zh: '取消', en: 'Cancel' },
  'common.delete': { zh: '删除', en: 'Delete' },
  'common.close': { zh: '关闭', en: 'Close' },
  'common.create': { zh: '创建', en: 'Create' },
  'common.add': { zh: '添加', en: 'Add' },
  'common.example': { zh: '例如', en: 'e.g.' },
  'common.confirmDelete': { zh: '确认删除', en: 'Confirm Delete' },
  'common.confirmDeleteDesc': { zh: '确定要删除这笔', en: 'Are you sure you want to delete this' },
  'common.irreversible': { zh: '吗？此操作不可撤销。', en: '? This action cannot be undone.' },
  'common.unknown': { zh: '未知错误', en: 'Unknown error' },

  // Categories
  'cat.差旅': { zh: '差旅', en: 'Travel' },
  'cat.物料': { zh: '物料', en: 'Materials' },
  'cat.人工': { zh: '人工', en: 'Labor' },
  'cat.三方': { zh: '三方', en: '3rd Party' },
  'cat.其他': { zh: '其他', en: 'Other' },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'zh' as Language,
      setLang: () => {},
      t: (key: TranslationKey) => translations[key]?.zh || key,
    };
  }
  return ctx;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved === 'en' || saved === 'zh') ? saved : 'zh';
  });

  const handleSetLang = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app-language', newLang);
  }, []);

  const t = useCallback((key: TranslationKey) => {
    const entry = translations[key];
    return entry ? entry[lang] : key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
