import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const AppLayout = () => (
  <SidebarProvider defaultOpen={typeof window !== 'undefined' ? window.innerWidth >= 768 : true}>
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-12 flex items-center gap-2 border-b bg-background/95 backdrop-blur px-3">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  </SidebarProvider>
);

export default AppLayout;
