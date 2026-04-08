import { useApp } from '@/context/AppContext';
import ExpenseBreakdown from '@/components/ExpenseBreakdown';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/StatCard';
import { DollarSign, TrendingDown, Users } from 'lucide-react';

const ProjectsPage = () => {
  const { projects } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">项目管理</h2>
        <p className="text-muted-foreground text-sm">查看每个项目和展位的详细信息</p>
      </div>

      {projects.map(project => {
        const totalExpenses = project.expenses.reduce((s, e) => s + e.amount, 0);

        return (
          <div key={project.id} className="space-y-4">
            <h3 className="text-lg font-semibold">{project.name}</h3>

            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                {project.booths.map(b => (
                  <TabsTrigger key={b.id} value={b.id}>{b.clientName}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard title="合同总额" value={`$${project.booths.reduce((s, b) => s + b.totalContract, 0).toLocaleString()}`} icon={DollarSign} />
                  <StatCard title="总支出" value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingDown} variant="warning" />
                  <StatCard title="利润" value={`$${(project.booths.reduce((s, b) => s + b.totalContract, 0) - totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} variant="success" />
                </div>
                <div className="glass-card rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">全部开销</h4>
                    <AddExpenseDialog projectId={project.id} />
                  </div>
                  <ExpenseBreakdown expenses={project.expenses} title={`${project.name} Spending`} />
                </div>
              </TabsContent>

              {project.booths.map(booth => {
                const boothThirdParty = project.expenses.filter(e => e.boothId === booth.id);
                const boothTotal = boothThirdParty.reduce((s, e) => s + e.amount, 0);
                const profit = booth.totalContract - boothTotal;

                // Work logs for this booth
                const boothWorkLogs = project.workLogs.filter(w => w.boothId === booth.id);

                return (
                  <TabsContent key={booth.id} value={booth.id} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard title="合同金额" value={`$${booth.totalContract.toLocaleString()}`} icon={DollarSign} />
                      <StatCard title="三方费用" value={`$${boothTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingDown} variant="warning" />
                      <StatCard title="展位利润" value={`$${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} variant={profit > 0 ? 'success' : 'destructive'} />
                    </div>
                    <div className="glass-card rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{booth.clientName} 三方费用</h4>
                        <AddExpenseDialog projectId={project.id} boothId={booth.id} />
                      </div>
                      {boothThirdParty.length > 0 ? (
                        <ExpenseBreakdown expenses={boothThirdParty} />
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">暂无三方费用</p>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectsPage;
