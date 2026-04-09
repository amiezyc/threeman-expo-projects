import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const InviteUserPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [loading, setLoading] = useState(false);

  // List of existing profiles
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, name, role, daily_rate, hourly_rate');
    setProfiles(data || []);
    setLoaded(true);
  };

  if (!loaded) loadProfiles();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('create-invite', {
      body: { email, name, role },
    });

    setLoading(false);
    if (error || data?.error) {
      toast.error('邀请失败: ' + (data?.error || error?.message || '未知错误'));
    } else {
      const link = data?.actionLink;
      toast.success(`已创建用户 ${email}`);
      if (link) {
        // Copy accept-invite link to clipboard
        const acceptUrl = `${window.location.origin}/accept-invite#token=${new URL(link).searchParams.get('token') || ''}`;
        navigator.clipboard.writeText(acceptUrl).then(() => {
          toast.info('邀请链接已复制到剪贴板');
        }).catch(() => {});
      }
      setEmail('');
      setName('');
      loadProfiles();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">用户管理</h2>
        <p className="text-muted-foreground text-sm">邀请新用户加入系统</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> 邀请新用户
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="张三" />
              </div>
              <div className="space-y-2">
                <Label>邮箱</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <Select value={role} onValueChange={v => setRole(v as 'admin' | 'employee')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">员工</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              发送邀请
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">已有用户</CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无用户</p>
          ) : (
            <div className="space-y-2">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-border/50 px-4 py-3">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.role === 'admin' ? '管理员' : '员工'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {p.daily_rate && `日薪 $${p.daily_rate}`}
                    {p.hourly_rate && ` / 时薪 $${p.hourly_rate}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteUserPage;
