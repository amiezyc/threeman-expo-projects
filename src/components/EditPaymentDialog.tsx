import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, FileText, Sparkles } from 'lucide-react';
import { Payment, PaymentStatus, PaymentType } from '@/types';
import { uploadFile } from '@/lib/uploadFile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

interface EditPaymentDialogProps {
  payment: Payment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payment: Payment) => void;
}

const EditPaymentDialog = ({ payment, open, onOpenChange, onSave }: EditPaymentDialogProps) => {
  const { t } = useLanguage();
  const [paymentType, setPaymentType] = useState<PaymentType>(payment.type);
  const [amount, setAmount] = useState(String(payment.amount));
  const [receivedAmount, setReceivedAmount] = useState(String(payment.receivedAmount ?? 0));
  const [status, setStatus] = useState<PaymentStatus>(payment.status);
  const [invoiceDate, setInvoiceDate] = useState(payment.invoiceDate || '');
  const [dueDate, setDueDate] = useState(payment.dueDate || '');
  const [invoiceNumber, setInvoiceNumber] = useState(payment.invoiceNumber || '');
  const [followUpNotes, setFollowUpNotes] = useState(payment.followUpNotes || '');
  const [notes, setNotes] = useState(payment.notes || '');
  const [documentUrl, setDocumentUrl] = useState(payment.documentUrl || '');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile('receipts', 'contracts', file);
      setDocumentUrl(url);
      setUploadedFile(file);
      toast.success(t('upload.uploaded'));
    } catch {
      toast.error(t('upload.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async () => {
    if (!uploadedFile) { toast.error(t('ai.uploadFirst')); return; }
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const { data, error } = await supabase.functions.invoke('analyze-contract', { body: { imageBase64: base64 } });
          if (error) throw error;
          if (data) {
            if (data.depositAmount > 0 && paymentType === 'deposit') setAmount(String(data.depositAmount));
            else if (data.balanceAmount > 0 && paymentType === 'balance') setAmount(String(data.balanceAmount));
            else if (data.depositAmount > 0) setAmount(String(data.depositAmount));
            if (data.invoiceDate) setInvoiceDate(data.invoiceDate);
            if (data.isReceived) setStatus('received');
            else if (data.invoiceDate) setStatus('invoiced');
            if (data.notes) setNotes(data.notes);
            toast.success(t('ai.recognized'));
          }
        } catch {
          toast.error(t('ai.recognizeFailed'));
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(uploadedFile);
    } catch {
      toast.error(t('ai.recognizeFailed'));
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!amount) { toast.error(t('payments.fillAmount')); return; }
    onSave({
      ...payment, type: paymentType, amount: Number(amount), status,
      invoiceDate: invoiceDate || undefined, notes: notes || undefined, documentUrl: documentUrl || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('payments.editPayment')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('upload.contract')}</Label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('upload.uploading')}</> : <><Upload className="h-4 w-4 mr-2" />{t('upload.selectFile')}</>}
              </Button>
              <Button variant="secondary" onClick={handleExtract} disabled={!uploadedFile || analyzing}>
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-1">{t('ai.recognize')}</span>
              </Button>
            </div>
            {documentUrl && (
              <div className="flex items-center gap-2 text-xs text-success">
                <FileText className="h-3 w-3" />
                <span>{t('upload.uploaded')}</span>
                <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="underline">{t('upload.view')}</a>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t('payments.type')}</Label>
            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">{t('payments.deposit')}</SelectItem>
                <SelectItem value="balance">{t('payments.balance')}</SelectItem>
                <SelectItem value="extra">加项</SelectItem>
                <SelectItem value="reimburse_charge">垫付收费</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('payments.amount')}</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>{t('payments.status')}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('payments.status.pending')}</SelectItem>
                <SelectItem value="invoiced">{t('payments.status.invoiced')}</SelectItem>
                <SelectItem value="received">{t('payments.status.received')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('payments.invoiceDate')}</Label>
            <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('payments.notes')}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('payments.notesPlaceholder')} rows={2} />
          </div>
          <Button className="w-full" onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPaymentDialog;
