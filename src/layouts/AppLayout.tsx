import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';

const AppLayout = () => (
  <div className="flex h-screen overflow-hidden">
    <AppSidebar />
    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
