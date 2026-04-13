import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/context/LanguageContext";
import AppLayout from "@/layouts/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SetPasswordPage from "./pages/SetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import Dashboard from "./pages/Dashboard";
import ProjectsPage from "./pages/ProjectsPage";
import PaymentsPage from "./pages/PaymentsPage";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import InviteUserPage from "./pages/InviteUserPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import CategoriesPage from "./pages/CategoriesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const { profile, loading, session } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return null;
  return <Navigate to={profile.role === 'admin' ? '/admin' : '/employee'} replace />;
};

const AdminLayout = () => (
  <ProtectedRoute requireAdmin>
    <AppProvider>
      <AppLayout />
    </AppProvider>
  </ProtectedRoute>
);

const EmployeeLayout = () => (
  <ProtectedRoute>
    <AppProvider>
      <AppLayout />
    </AppProvider>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Admin routes */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/projects" element={<ProjectsPage />} />
              <Route path="/admin/payments" element={<PaymentsPage />} />
              <Route path="/admin/employees" element={<EmployeesPage />} />
              <Route path="/admin/invite" element={<InviteUserPage />} />
              <Route path="/admin/categories" element={<CategoriesPage />} />
            </Route>

            {/* Employee routes */}
            <Route element={<EmployeeLayout />}>
              <Route path="/employee" element={<EmployeeDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
