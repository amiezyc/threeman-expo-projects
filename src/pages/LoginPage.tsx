import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Globe } from 'lucide-react';

const LoginPage = () => {
  const { signIn, session, profile, loading: authLoading } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authLoading && session && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || t('auth.loginFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-end">
            <button
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
          </div>
          <CardTitle className="text-xl">{t('app.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('app.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.login')}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">{t('auth.inviteOnly')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
