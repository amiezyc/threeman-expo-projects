import { useApp } from '@/context/AppContext';
import Dashboard from './Dashboard';
import EmployeeExpenses from './EmployeeExpenses';

const Index = () => {
  const { user } = useApp();
  return user.role === 'boss' ? <Dashboard /> : <EmployeeExpenses />;
};

export default Index;
