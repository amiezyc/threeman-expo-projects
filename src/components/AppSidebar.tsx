import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, FolderOpen, UserPlus, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';

const AppSidebar = () => {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = isAdmin
    ? [
        { label: '总览', icon: LayoutDashboard, path: '/admin' },
        { label: '项目管理', icon: FolderOpen, path: '/admin/projects' },
        { label: '收款追踪', icon: Receipt, path: '/admin/payments' },
        { label: '员工管理', icon: Users, path: '/admin/employees' },
        { label: '用户管理', icon: UserPlus, path: '/admin/invite' },
      ]
    : [
        { label: '我的', icon: LayoutDashboard, path: '/employee' },
      ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar-primary-foreground">展台管理系统</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Booth Builder Pro</p>
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

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">{profile?.name || '用户'}</p>
            <p className="text-xs text-sidebar-foreground/50">{isAdmin ? '管理员' : '员工'}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
