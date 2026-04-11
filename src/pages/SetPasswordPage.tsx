import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const SetPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=invite') || hash.includes('type=recovery')) {
      setReady(true);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
        else navigate('/login');
      });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error(t('auth.passwordMismatch')); return; }
    if (password.length < 6) { toast.error(t('auth.passwordTooShort')); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message || t('auth.setFailed'));
    } else {
      toast.success(t('auth.passwordSet'));
      navigate('/');
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('auth.setPassword')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('auth.setPasswordDesc')}</p>
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

export default SetPasswordPage;
