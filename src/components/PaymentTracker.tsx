import { Payment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, FileText, Paperclip } from 'lucide-react';

const statusConfig = {
  received: { label: '已收款', icon: CheckCircle, variant: 'default' as const, className: 'bg-success/10 text-success border-success/20' },
  invoiced: { label: '已开票', icon: FileText, variant: 'secondary' as const, className: 'bg-warning/10 text-warning border-warning/20' },
  pending: { label: '待处理', icon: Clock, variant: 'outline' as const, className: 'bg-muted text-muted-foreground' },
};

interface PaymentTrackerProps {
  payments: Payment[];
  clientName: string;
}

const PaymentTracker = ({ payments, clientName }: PaymentTrackerProps) => {
  const totalReceived = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status !== 'received').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{clientName}</h4>
        <div className="flex gap-3 text-sm">
          <span className="text-success font-medium">已收 ${totalReceived.toLocaleString()}</span>
          <span className="text-warning font-medium">待收 ${totalPending.toLocaleString()}</span>
        </div>
      </div>
      <div className="space-y-2">
        {payments.map(payment => {
          const config = statusConfig[payment.status];
          const Icon = config.icon;
          return (
            <div key={payment.id} className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">{payment.type === 'deposit' ? '首款' : '尾款'}</span>
                  <span className="ml-2 text-sm font-bold">${payment.amount.toLocaleString()}</span>
                  {payment.invoiceDate && (
                    <span className="ml-2 text-xs text-muted-foreground">{payment.invoiceDate}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {payment.documentUrl && (
                  <a href={payment.documentUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-3.5 w-3.5" />
                  </a>
                )}
                {payment.notes && <span className="text-xs text-muted-foreground max-w-[200px] truncate">{payment.notes}</span>}
                <Badge className={config.className}>{config.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentTracker;
