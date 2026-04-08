import { useApp } from '@/context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, FolderOpen, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const { user, setUserRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isBoss = user.role === 'boss';

  const navItems = isBoss
    ? [
        { label: '总览', icon: LayoutDashboard, path: '/' },
        { label: '项目管理', icon: FolderOpen, path: '/projects' },
        { label: '收款追踪', icon: Receipt, path: '/payments' },
        { label: '员工管理', icon: Users, path: '/employees' },
      ]
    : [
        { label: '我的开销', icon: Receipt, path: '/' },
        { label: '工时记录', icon: Users, path: '/worklog' },
      ];

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
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/50">{isBoss ? '管理员' : '员工'}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={() => setUserRole(isBoss ? 'employee' : 'boss')}
            title="切换角色"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
