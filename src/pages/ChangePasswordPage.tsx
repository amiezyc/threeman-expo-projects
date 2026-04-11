import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('两次密码不一致'); return; }
    if (password.length < 6) { toast.error('密码至少6位'); return; }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      toast.error(error.message || '修改失败');
      return;
    }

    // Clear must_change_password flag
    await supabase.from('profiles').update({ must_change_password: false } as any).eq('id', profile?.id);

    setLoading(false);
    toast.success('密码已修改，请重新登录');
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            修改密码
          </CardTitle>
          <p className="text-sm text-muted-foreground">您需要设置新密码后才能继续使用系统</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>新密码</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>确认密码</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认修改
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
