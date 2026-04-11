import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const token = useMemo(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    return params.get('token') || params.get('access_token') || new URLSearchParams(window.location.search).get('token') || '';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error(t('auth.passwordMismatch')); return; }
    if (password.length < 6) { toast.error(t('auth.passwordTooShort')); return; }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke('accept-invite', {
      body: { token, password },
    });
    setLoading(false);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || t('auth.acceptInviteFailed'));
      return;
    }

    if (data?.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      toast.success(t('auth.passwordSetLogin'));
      const role = data.role || 'employee';
      navigate(role === 'admin' ? '/admin' : '/employee');
    } else {
      toast.success(t('auth.passwordSetPleaseLogin'));
      navigate('/login');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{t('auth.invalidInvite')}</p>
            <Button className="mt-4" onClick={() => navigate('/login')}>{t('auth.backToLogin')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('auth.setPassword')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('auth.setPasswordInviteDesc')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('auth.newPassword')}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.confirmPassword')}</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.confirm')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitePage;
