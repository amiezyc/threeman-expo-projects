import { useApp } from '@/context/AppContext';
import PaymentTracker from '@/components/PaymentTracker';
import StatCard from '@/components/StatCard';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';

const PaymentsPage = () => {
  const { projects } = useApp();
  const allBooths = projects.flatMap(p => p.booths);
  const allPayments = allBooths.flatMap(b => b.payments);

  const totalAmount = allPayments.reduce((s, p) => s + p.amount, 0);
  const received = allPayments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const pending = allPayments.filter(p => p.status !== 'received').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">收款追踪</h2>
        <p className="text-muted-foreground text-sm">管理所有客户的收款进度</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="总金额" value={`$${totalAmount.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="已收款" value={`$${received.toLocaleString()}`} icon={CheckCircle} variant="success" />
        <StatCard title="待收款" value={`$${pending.toLocaleString()}`} icon={Clock} variant="warning" />
      </div>

      {projects.map(project => (
        <div key={project.id} className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">{project.name}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {project.booths.map(booth => (
              <div key={booth.id} className="glass-card rounded-lg p-5">
                <PaymentTracker payments={booth.payments} clientName={booth.clientName} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentsPage;
