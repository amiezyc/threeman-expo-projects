import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // Extract token from URL hash or query params
  const token = useMemo(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    return params.get('token') || params.get('access_token') || new URLSearchParams(window.location.search).get('token') || '';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('两次密码不一致'); return; }
    if (password.length < 6) { toast.error('密码至少6位'); return; }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke('accept-invite', {
      body: { token, password },
    });
    setLoading(false);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || '接受邀请失败');
      return;
    }

    toast.success('密码设置成功，请登录');
    navigate('/login');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">无效的邀请链接</p>
            <Button className="mt-4" onClick={() => navigate('/login')}>返回登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">设置密码</CardTitle>
          <p className="text-sm text-muted-foreground">请设置你的登录密码以完成注册</p>
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
              确认
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitePage;
