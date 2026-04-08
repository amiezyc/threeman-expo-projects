import { useApp } from '@/context/AppContext';
import ExpenseBreakdown from '@/components/ExpenseBreakdown';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import ProfitSharing from '@/components/ProfitSharing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/StatCard';
import { DollarSign, TrendingDown, PieChart } from 'lucide-react';
import { Expense } from '@/types';

const ProjectsPage = () => {
  const { projects } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">项目管理</h2>
        <p className="text-muted-foreground text-sm">查看每个项目和展位的详细信息</p>
      </div>

      {projects.map(project => {
        const totalContract = project.booths.reduce((s, b) => s + b.totalContract, 0);
        const totalExpenses = project.expenses.reduce((s, e) => s + e.amount, 0);
        const profit = totalContract - totalExpenses;

        // Shared expenses (差旅, 物料, 人工) - no boothId
        const sharedExpenses = project.expenses.filter(e => !e.boothId && ['差旅', '物料', '人工'].includes(e.mainCategory));
        const sharedTotal = sharedExpenses.reduce((s, e) => s + e.amount, 0);

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
                  <StatCard title="合同总额" value={`$${totalContract.toLocaleString()}`} icon={DollarSign} />
                  <StatCard title="总支出" value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingDown} variant="warning" />
                  <StatCard title="利润" value={`$${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} variant={profit > 0 ? 'success' : 'destructive'} />
                </div>

                {project.partners && project.partners.length > 0 && (
                  <ProfitSharing partners={project.partners} totalProfit={profit} />
                )}

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
                const boothThirdPartyTotal = boothThirdParty.reduce((s, e) => s + e.amount, 0);

                // Calculate proportional share of shared expenses
                const boothRatio = totalContract > 0 ? booth.totalContract / totalContract : 0;
                const allocatedShared = Math.round(sharedTotal * boothRatio * 100) / 100;
                const boothTotalCost = boothThirdPartyTotal + allocatedShared;
                const boothProfit = booth.totalContract - boothTotalCost;

                return (
                  <TabsContent key={booth.id} value={booth.id} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <StatCard title="合同金额" value={`$${booth.totalContract.toLocaleString()}`} icon={DollarSign} />
                      <StatCard title="三方费用" value={`$${boothThirdPartyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingDown} variant="warning" />
                      <StatCard
                        title="分摊公共费用"
                        value={`$${allocatedShared.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        subtitle={`占比 ${(boothRatio * 100).toFixed(0)}%`}
                        icon={PieChart}
                      />
                      <StatCard title="展位利润" value={`$${boothProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} variant={boothProfit > 0 ? 'success' : 'destructive'} />
                    </div>

                    {/* Allocated shared expenses breakdown */}
                    {sharedExpenses.length > 0 && (
                      <div className="glass-card rounded-lg p-5">
                        <h4 className="font-semibold mb-2">分摊公共费用明细 ({(boothRatio * 100).toFixed(0)}%)</h4>
                        <div className="space-y-1 text-sm">
                          {(['差旅', '物料', '人工'] as const).map(cat => {
                            const catItems = sharedExpenses.filter(e => e.mainCategory === cat);
                            if (catItems.length === 0) return null;
                            const catTotal = catItems.reduce((s, e) => s + e.amount, 0);
                            const allocated = Math.round(catTotal * boothRatio * 100) / 100;
                            return (
                              <div key={cat} className="flex justify-between rounded-md px-4 py-2 bg-muted/30">
                                <span>{cat}</span>
                                <span className="text-muted-foreground">
                                  ${catTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} × {(boothRatio * 100).toFixed(0)}% = <span className="font-semibold text-foreground">${allocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
