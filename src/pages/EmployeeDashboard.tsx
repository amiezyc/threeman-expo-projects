import EmployeeExpenses from './EmployeeExpenses';
import WorkLogPage from './WorkLogPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EmployeeDashboard = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">我的开销</TabsTrigger>
          <TabsTrigger value="worklog">工时记录</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          <EmployeeExpenses />
        </TabsContent>
        <TabsContent value="worklog">
          <WorkLogPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDashboard;
