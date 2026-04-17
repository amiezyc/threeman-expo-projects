import { useState } from 'react';
import { Payment, PaymentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, Paperclip, Pencil, Trash2, AlertTriangle, CircleDollarSign } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import EditPaymentDialog from '@/components/EditPaymentDialog';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

interface PaymentTrackerProps {
  payments: Payment[];
  clientName: string;
  onUpdatePayment?: (payment: Payment) => void;
  onDeletePayment?: (boothId: string, paymentId: string) => void;
}

// Derive UI status from received_amount + due_date
const deriveStatus = (p: Payment): PaymentStatus => {
  const rec = p.receivedAmount ?? 0;
  if (rec >= p.amount && p.amount > 0) return 'received';
  if (rec > 0 && rec < p.amount) {
    if (p.dueDate && new Date(p.dueDate) < new Date()) return 'overdue';
    return 'partial';
  }
  if (p.dueDate && new Date(p.dueDate) < new Date() && (p.status === 'invoiced' || p.status === 'overdue')) return 'overdue';
  return p.status;
};

const PaymentTracker = ({ payments, clientName, onUpdatePayment, onDeletePayment }: PaymentTrackerProps) => {
  const { t } = useLanguage();
  const totalReceived = payments.reduce((s, p) => s + (p.receivedAmount ?? (p.status === 'received' ? p.amount : 0)), 0);
  const totalPending = payments.reduce((s, p) => s + Math.max(0, p.amount - (p.receivedAmount ?? (p.status === 'received' ? p.amount : 0))), 0);

  const statusConfig: Record<PaymentStatus, { label: string; icon: any; className: string }> = {
    received: { label: t('payments.status.received'), icon: CheckCircle, className: 'bg-success/10 text-success border-success/20 cursor-pointer hover:opacity-80' },
    partial: { label: '部分收款', icon: CircleDollarSign, className: 'bg-orange-500/10 text-orange-600 border-orange-500/20 cursor-pointer hover:opacity-80' },
    invoiced: { label: t('payments.status.invoiced'), icon: FileText, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 cursor-pointer hover:opacity-80' },
    overdue: { label: '已逾期', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive border-destructive/20 cursor-pointer hover:opacity-80' },
    pending: { label: t('payments.status.pending'), icon: Clock, className: 'bg-muted text-muted-foreground cursor-pointer hover:opacity-80' },
  };

  // Cycle: pending(草稿) -> invoiced -> received. Partial/overdue computed automatically.
  const statusCycle: PaymentStatus[] = ['pending', 'invoiced', 'received'];

  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [dateEditId, setDateEditId] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState('');
  const [recvEditId, setRecvEditId] = useState<string | null>(null);
  const [recvValue, setRecvValue] = useState('');

  const handleStatusClick = (payment: Payment) => {
    if (!onUpdatePayment) return;
    const current = deriveStatus(payment);
    // If partial/overdue, clicking forces fully received
    if (current === 'partial' || current === 'overdue') {
      onUpdatePayment({ ...payment, receivedAmount: payment.amount, status: 'received', receivedDate: payment.receivedDate || new Date().toISOString().split('T')[0] });
      toast.success('状态已更改为: 已收款');
      return;
    }
    const idx = statusCycle.indexOf(current);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    const updated: Payment = { ...payment, status: next };
    if (next === 'received') {
      updated.receivedAmount = payment.amount;
      updated.receivedDate = payment.receivedDate || new Date().toISOString().split('T')[0];
    } else if (next === 'pending') {
      updated.receivedAmount = 0;
    }
    onUpdatePayment(updated);
    toast.success(`${t('payments.statusChanged')}: ${statusConfig[next].label}`);
  };

  const handleDateSave = (payment: Payment) => {
    if (!onUpdatePayment) return;
    onUpdatePayment({ ...payment, invoiceDate: dateValue || undefined });
    setDateEditId(null);
    toast.success(t('payments.dateUpdated'));
  };

  const handleRecvSave = (payment: Payment) => {
    if (!onUpdatePayment) return;
    const v = Number(recvValue);
    if (Number.isNaN(v) || v < 0) { setRecvEditId(null); return; }
    onUpdatePayment({ ...payment, receivedAmount: Math.min(v, payment.amount) });
    setRecvEditId(null);
    toast.success('已更新已收金额');
  };

  const typeLabel = (type: string) => {
    if (type === 'deposit') return t('payments.depositShort');
    if (type === 'balance') return t('payments.balanceShort');
    if (type === 'extra') return '加项';
    if (type === 'reimburse_charge') return '垫付收费';
    return type;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{clientName}</h4>
        <div className="flex gap-3 text-sm">
          <span className="text-success font-medium">{t('payments.receivedAmount')} ${totalReceived.toLocaleString()}</span>
          <span className="text-warning font-medium">{t('payments.pendingAmount')} ${totalPending.toLocaleString()}</span>
        </div>
      </div>
      <div className="space-y-2">
        {payments.map(payment => {
          const uiStatus = deriveStatus(payment);
          const config = statusConfig[uiStatus];
          const Icon = config.icon;
          const received = payment.receivedAmount ?? (payment.status === 'received' ? payment.amount : 0);
          const remaining = Math.max(0, payment.amount - received);
          return (
            <div key={payment.id} className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{typeLabel(payment.type)}</span>
                  <span className="text-sm font-bold">${payment.amount.toLocaleString()}</span>
                  {(received > 0 || uiStatus === 'partial' || uiStatus === 'received') && (
                    recvEditId === payment.id ? (
                      <Input type="number" value={recvValue} onChange={e => setRecvValue(e.target.value)} onBlur={() => handleRecvSave(payment)} onKeyDown={e => e.key === 'Enter' && handleRecvSave(payment)} className="h-6 w-24 text-xs" autoFocus />
                    ) : (
                      <span className="text-xs text-success cursor-pointer hover:underline" onClick={() => { if (onUpdatePayment) { setRecvEditId(payment.id); setRecvValue(String(received)); } }} title="点击编辑已收金额">
                        已收 ${received.toLocaleString()}{remaining > 0 ? ` / 剩 $${remaining.toLocaleString()}` : ''}
                      </span>
                    )
                  )}
                  {dateEditId === payment.id ? (
                    <Input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} onBlur={() => handleDateSave(payment)} onKeyDown={e => e.key === 'Enter' && handleDateSave(payment)} className="h-6 w-36 text-xs" autoFocus />
                  ) : (
                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:underline" onClick={() => { if (onUpdatePayment) { setDateEditId(payment.id); setDateValue(payment.invoiceDate || ''); } }}>
                      {payment.invoiceDate || t('payments.setDate')}
                    </span>
                  )}
                  {payment.dueDate && (
                    <span className={`text-xs ${uiStatus === 'overdue' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      到期 {payment.dueDate}
                    </span>
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
                <Badge className={config.className} onClick={() => handleStatusClick(payment)}>{config.label}</Badge>
                {onUpdatePayment && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPayment(payment)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDeletePayment && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(payment)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editPayment && onUpdatePayment && (
        <EditPaymentDialog payment={editPayment} open={!!editPayment} onOpenChange={(open) => { if (!open) setEditPayment(null); }} onSave={(updated) => { onUpdatePayment(updated); setEditPayment(null); }} />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirmDeleteDesc')}{deleteTarget ? typeLabel(deleteTarget.type) : ''} ${deleteTarget?.amount.toLocaleString()} {t('common.irreversible')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget && onDeletePayment) { onDeletePayment(deleteTarget.boothId, deleteTarget.id); setDeleteTarget(null); } }}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaymentTracker;
