import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import PaymentTracker from '@/components/PaymentTracker';
import ExpenseTable from '@/components/ExpenseTable';
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';

const Dashboard = () => {
  const { projects } = useApp();

  const allBooths = projects.flatMap(p => p.booths);
  const allExpenses = allBooths.flatMap(b => b.expenses);
  const allWorkLogs = allBooths.flatMap(b => b.workLogs);

  const totalContract = allBooths.reduce((s, b) => s + b.totalContract, 0);
  const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);
  const totalLabor = allWorkLogs.reduce((s, w) => s + w.dailyRate, 0);
  const totalCost = totalExpenses + totalLabor;
  const totalReceived = allBooths.flatMap(b => b.payments).filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const totalPending = allBooths.flatMap(b => b.payments).filter(p => p.status !== 'received').reduce((s, p) => s + p.amount, 0);
  const profit = totalContract - totalCost;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">总览</h2>
        <p className="text-muted-foreground text-sm">所有项目的财务概况</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="合同总额" value={`$${totalContract.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="总成本" value={`$${totalCost.toLocaleString()}`} subtitle={`开销 $${totalExpenses.toLocaleString()} + 人工 $${totalLabor.toLocaleString()}`} icon={TrendingDown} variant="warning" />
        <StatCard title="预计利润" value={`$${profit.toLocaleString()}`} subtitle={`利润率 ${((profit / totalContract) * 100).toFixed(1)}%`} icon={TrendingUp} variant={profit > 0 ? 'success' : 'destructive'} />
        <StatCard title="待收款" value={`$${totalPending.toLocaleString()}`} subtitle={`已收 $${totalReceived.toLocaleString()}`} icon={Clock} variant="warning" />
      </div>

      {projects.map(project => (
        <div key={project.id} className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">{project.name}</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {project.booths.map(booth => (
              <div key={booth.id} className="glass-card rounded-lg p-5 space-y-4">
                <PaymentTracker payments={booth.payments} clientName={booth.clientName} />
              </div>
            ))}
          </div>

          <div className="glass-card rounded-lg p-5">
            <h4 className="font-semibold mb-3">最近开销</h4>
            <ExpenseTable expenses={allExpenses.slice(0, 10)} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
