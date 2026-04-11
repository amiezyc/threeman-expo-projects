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
import { useLanguage } from '@/context/LanguageContext';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error(t('auth.passwordMismatch')); return; }
    if (password.length < 6) { toast.error(t('auth.passwordTooShort')); return; }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      toast.error(error.message || t('auth.changeFailed'));
      return;
    }

    await supabase.from('profiles').update({ must_change_password: false } as any).eq('id', profile?.id);

    setLoading(false);
    toast.success(t('auth.passwordChanged'));
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {t('auth.changePassword')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('auth.mustChangePassword')}</p>
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
              {t('auth.confirmChange')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
