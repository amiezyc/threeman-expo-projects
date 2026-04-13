import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import StatCard from '@/components/StatCard';
import PaymentTracker from '@/components/PaymentTracker';
import ExpenseBreakdown from '@/components/ExpenseBreakdown';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import ProfitSharing from '@/components/ProfitSharing';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DollarSign, TrendingUp, TrendingDown, Clock, ChevronDown } from 'lucide-react';

const Dashboard = () => {
  const { projects } = useApp();
  const { t } = useLanguage();
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(projects.map(p => [p.id, true]))
  );

  const toggle = (id: string) => setOpenProjects(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('dashboard.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('dashboard.subtitle')}</p>
      </div>

      {projects.map(project => {
        const totalContract = project.booths.reduce((s, b) => s + b.totalContract, 0);
        const totalExpenses = project.expenses.filter(e => !e.isClientCost).reduce((s, e) => s + e.amount, 0);
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
                  <StatCard title={t('dashboard.totalContract')} value={`$${totalContract.toLocaleString()}`} icon={DollarSign} />
                  <StatCard title={t('dashboard.totalExpenses')} value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingDown} variant="warning" />
                  <StatCard title={t('dashboard.estimatedProfit')} value={`$${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} subtitle={`${t('dashboard.profitMargin')} ${((profit / totalContract) * 100).toFixed(1)}%`} icon={TrendingUp} variant={profit > 0 ? 'success' : 'destructive'} />
                  <StatCard title={t('dashboard.pendingPayment')} value={`$${totalPending.toLocaleString()}`} subtitle={`${t('dashboard.received')} $${totalReceived.toLocaleString()}`} icon={Clock} variant="warning" />
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
                    <h4 className="font-semibold">{t('dashboard.projectExpenses')}</h4>
                    <AddExpenseDialog projectId={project.id} />
                  </div>
                  <ExpenseBreakdown expenses={projectLevelExpenses} title={`${t('cat.差旅')} / ${t('cat.物料')} / ${t('cat.人工')} / ${t('cat.电费')}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {project.booths.map(booth => {
                    const bExpenses = boothExpenses(booth.id);
                    return (
                      <div key={booth.id} className="glass-card rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{booth.clientName} {t('dashboard.thirdPartyExpenses')}</h4>
                          <AddExpenseDialog projectId={project.id} boothId={booth.id} />
                        </div>
                        {bExpenses.length > 0 ? (
                          <ExpenseBreakdown expenses={bExpenses} />
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard.noThirdParty')}</p>
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
