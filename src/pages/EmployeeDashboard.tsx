import EmployeeExpenses from './EmployeeExpenses';
import WorkLogPage from './WorkLogPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';

const EmployeeDashboard = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">{t('employeeDash.expenses')}</TabsTrigger>
          <TabsTrigger value="worklog">{t('employeeDash.worklog')}</TabsTrigger>
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
