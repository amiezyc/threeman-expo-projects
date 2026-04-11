import { useState, useMemo } from 'react';
import { Payment, PaymentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, Paperclip, Pencil, Trash2 } from 'lucide-react';
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

const PaymentTracker = ({ payments, clientName, onUpdatePayment, onDeletePayment }: PaymentTrackerProps) => {
  const { t } = useLanguage();
  const totalReceived = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status !== 'received').reduce((s, p) => s + p.amount, 0);

  const statusConfig = {
    received: { label: t('payments.status.received'), icon: CheckCircle, className: 'bg-success/10 text-success border-success/20 cursor-pointer hover:opacity-80' },
    invoiced: { label: t('payments.status.invoiced'), icon: FileText, className: 'bg-warning/10 text-warning border-warning/20 cursor-pointer hover:opacity-80' },
    pending: { label: t('payments.status.pending'), icon: Clock, className: 'bg-muted text-muted-foreground cursor-pointer hover:opacity-80' },
  };

  const statusCycle: PaymentStatus[] = ['pending', 'invoiced', 'received'];

  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [dateEditId, setDateEditId] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState('');

  const handleStatusClick = (payment: Payment) => {
    if (!onUpdatePayment) return;
    const currentIdx = statusCycle.indexOf(payment.status);
    const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
    onUpdatePayment({ ...payment, status: nextStatus });
    toast.success(`${t('payments.statusChanged')}: ${statusConfig[nextStatus].label}`);
  };

  const handleDateSave = (payment: Payment) => {
    if (!onUpdatePayment) return;
    onUpdatePayment({ ...payment, invoiceDate: dateValue || undefined });
    setDateEditId(null);
    toast.success(t('payments.dateUpdated'));
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
          const config = statusConfig[payment.status];
          const Icon = config.icon;
          return (
            <div key={payment.id} className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{payment.type === 'deposit' ? t('payments.depositShort') : t('payments.balanceShort')}</span>
                  <span className="text-sm font-bold">${payment.amount.toLocaleString()}</span>
                  {dateEditId === payment.id ? (
                    <Input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} onBlur={() => handleDateSave(payment)} onKeyDown={e => e.key === 'Enter' && handleDateSave(payment)} className="h-6 w-36 text-xs" autoFocus />
                  ) : (
                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:underline" onClick={() => { if (onUpdatePayment) { setDateEditId(payment.id); setDateValue(payment.invoiceDate || ''); } }}>
                      {payment.invoiceDate || t('payments.setDate')}
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
              {t('common.confirmDeleteDesc')}{deleteTarget?.type === 'deposit' ? t('payments.depositShort') : t('payments.balanceShort')} ${deleteTarget?.amount.toLocaleString()} {t('common.irreversible')}
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
