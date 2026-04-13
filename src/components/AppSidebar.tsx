import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, FolderOpen, UserPlus, LogOut, Globe, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';

const AppSidebar = () => {
  const { profile, isAdmin, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = isAdmin
    ? [
        { label: t('nav.overview'), icon: LayoutDashboard, path: '/admin' },
        { label: t('nav.projects'), icon: FolderOpen, path: '/admin/projects' },
        { label: t('nav.payments'), icon: Receipt, path: '/admin/payments' },
        { label: t('nav.employees'), icon: Users, path: '/admin/employees' },
        { label: t('nav.users'), icon: UserPlus, path: '/admin/invite' },
        { label: t('nav.categories'), icon: Settings, path: '/admin/categories' },
      ]
    : [
        { label: t('nav.myDashboard'), icon: LayoutDashboard, path: '/employee' },
      ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar-primary-foreground">{t('app.title')}</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">{t('app.subtitle')}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
        <ChangePasswordDialog />
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <Globe className="h-4 w-4" />
          {lang === 'zh' ? 'English' : '中文'}
        </button>

        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">{profile?.name || t('nav.user')}</p>
            <p className="text-xs text-sidebar-foreground/50">{isAdmin ? t('nav.admin') : t('nav.employee')}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
            title={t('auth.signOut')}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
