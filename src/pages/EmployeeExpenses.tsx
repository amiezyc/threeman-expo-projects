import { useApp } from '@/context/AppContext';
import ExpenseTable from '@/components/ExpenseTable';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EmployeeExpenses = () => {
  const { user, projects } = useApp();
  const allBooths = projects.flatMap(p => p.booths);
  const myExpenses = allBooths.flatMap(b => b.expenses).filter(e => e.userId === user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">我的开销</h2>
        <p className="text-muted-foreground text-sm">提交和查看你的开销记录</p>
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
              const boothExpenses = booth.expenses.filter(e => e.userId === user.id);
              return (
                <TabsContent key={booth.id} value={booth.id}>
                  <div className="glass-card rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">开销记录</h4>
                      <AddExpenseDialog boothId={booth.id} projectId={project.id} />
                    </div>
                    <ExpenseTable expenses={boothExpenses} showUser={false} />
                    {boothExpenses.length > 0 && (
                      <div className="text-right mt-3 text-sm font-bold">
                        合计: ${boothExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                      </div>
                    )}
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

export default EmployeeExpenses;
