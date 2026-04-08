import { useApp } from '@/context/AppContext';
import ExpenseTable from '@/components/ExpenseTable';
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

      {projects.map(project => (
        <div key={project.id} className="space-y-4">
          <h3 className="text-lg font-semibold">{project.name}</h3>
          
          <Tabs defaultValue={project.booths[0]?.id}>
            <TabsList>
              {project.booths.map(b => (
                <TabsTrigger key={b.id} value={b.id}>{b.clientName}</TabsTrigger>
              ))}
            </TabsList>

            {project.booths.map(booth => {
              const expenseTotal = booth.expenses.reduce((s, e) => s + e.amount, 0);
              const laborTotal = booth.workLogs.reduce((s, w) => s + w.dailyRate, 0);
              const totalCost = expenseTotal + laborTotal;
              const profit = booth.totalContract - totalCost;

              return (
                <TabsContent key={booth.id} value={booth.id} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="合同金额" value={`$${booth.totalContract.toLocaleString()}`} icon={DollarSign} />
                    <StatCard title="总成本" value={`$${totalCost.toLocaleString()}`} subtitle={`开销 $${expenseTotal.toLocaleString()} + 人工 $${laborTotal.toLocaleString()}`} icon={TrendingDown} variant="warning" />
                    <StatCard title="利润" value={`$${profit.toLocaleString()}`} icon={DollarSign} variant={profit > 0 ? 'success' : 'destructive'} />
                  </div>

                  <div className="glass-card rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">开销明细</h4>
                      <AddExpenseDialog boothId={booth.id} projectId={project.id} />
                    </div>
                    <ExpenseTable expenses={booth.expenses} />
                  </div>

                  <div className="glass-card rounded-lg p-5">
                    <h4 className="font-semibold mb-3">工时记录</h4>
                    <div className="space-y-2">
                      {booth.workLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">暂无工时记录</p>
                      ) : (
                        <div className="grid gap-2">
                          {Object.entries(
                            booth.workLogs.reduce<Record<string, { days: number; rate: number }>>((acc, wl) => {
                              if (!acc[wl.userName]) acc[wl.userName] = { days: 0, rate: wl.dailyRate };
                              acc[wl.userName].days += 1;
                              return acc;
                            }, {})
                          ).map(([name, { days, rate }]) => (
                            <div key={name} className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{name}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">{days}天 × ${rate}/天</span>
                                <span className="font-bold">${(days * rate).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      ))}
    </div>
  );
};

export default ProjectsPage;
