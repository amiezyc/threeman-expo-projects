import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import PaymentTracker from '@/components/PaymentTracker';
import ExpenseBreakdown from '@/components/ExpenseBreakdown';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import ProfitSharing from '@/components/ProfitSharing';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DollarSign, TrendingUp, TrendingDown, Clock, ChevronDown } from 'lucide-react';

const Dashboard = () => {
  const { projects } = useApp();
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(projects.map(p => [p.id, true]))
  );

  const toggle = (id: string) => setOpenProjects(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">总览</h2>
        <p className="text-muted-foreground text-sm">所有项目的财务概况</p>
      </div>

      {projects.map(project => {
        const totalContract = project.booths.reduce((s, b) => s + b.totalContract, 0);
        const totalExpenses = project.expenses.reduce((s, e) => s + e.amount, 0);
        const totalReceived = project.booths.flatMap(b => b.payments).filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
        const totalPending = project.booths.flatMap(b => b.payments).filter(p => p.status !== 'received').reduce((s, p) => s + p.amount, 0);
        const profit = totalContract - totalExpenses;

        const boothExpenses = (boothId: string) => project.expenses.filter(e => e.boothId === boothId);
        const projectLevelExpenses = project.expenses.filter(e => !e.boothId);

        return (
          <Collapsible key={project.id} open={openProjects[project.id] !== false} onOpenChange={() => toggle(project.id)}>
            <div className="space-y-5">
              <CollapsibleTrigger className="flex items-center justify-between w-full border-b border-border pb-2 cursor-pointer hover:opacity-80">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openProjects[project.id] !== false ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-5 mt-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard title="合同总额" value={`$${totalContract.toLocaleString()}`} icon={DollarSign} />
                  <StatCard title="总支出" value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingDown} variant="warning" />
                  <StatCard title="预计利润" value={`$${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} subtitle={`利润率 ${((profit / totalContract) * 100).toFixed(1)}%`} icon={TrendingUp} variant={profit > 0 ? 'success' : 'destructive'} />
                  <StatCard title="待收款" value={`$${totalPending.toLocaleString()}`} subtitle={`已收 $${totalReceived.toLocaleString()}`} icon={Clock} variant="warning" />
                </div>

                {project.partners && project.partners.length > 0 && (
                  <ProfitSharing partners={project.partners} totalProfit={profit} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {project.booths.map(booth => (
                    <div key={booth.id} className="glass-card rounded-lg p-5">
                      <PaymentTracker payments={booth.payments} clientName={booth.clientName} />
                    </div>
                  ))}
                </div>

                <div className="glass-card rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">项目开销</h4>
                    <AddExpenseDialog projectId={project.id} />
                  </div>
                  <ExpenseBreakdown expenses={projectLevelExpenses} title="差旅 / 物料 / 人工" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {project.booths.map(booth => {
                    const bExpenses = boothExpenses(booth.id);
                    return (
                      <div key={booth.id} className="glass-card rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{booth.clientName} 三方费用</h4>
                          <AddExpenseDialog projectId={project.id} boothId={booth.id} />
                        </div>
                        {bExpenses.length > 0 ? (
                          <ExpenseBreakdown expenses={bExpenses} />
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">暂无三方费用</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default Dashboard;
