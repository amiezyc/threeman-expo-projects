import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { profile, loading, session } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return null;
  return <Navigate to={profile.role === 'admin' ? '/admin' : '/employee'} replace />;
};

export default Index;
