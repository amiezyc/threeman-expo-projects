import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, FolderOpen, UserPlus, LogOut, Globe, Settings, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const { profile, isAdmin, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === 'collapsed';

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

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setOpenMobile(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar-primary-foreground">{t('app.title')}</h1>
        {!collapsed && <p className="text-xs text-sidebar-foreground/60 mt-1">{t('app.subtitle')}</p>}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => handleNav(item.path)}
                      isActive={active}
                      tooltip={item.label}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <ChangePasswordDialog />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border space-y-2 p-3">
        <button
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span className="truncate">{lang === 'zh' ? 'English' : '中文'}</span>
        </button>

        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.name || t('nav.user')}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{isAdmin ? t('nav.admin') : t('nav.employee')}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
            title={t('auth.signOut')}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
