import { useState, useMemo, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import PaymentTracker from '@/components/PaymentTracker';
import StatCard from '@/components/StatCard';
import { DollarSign, CheckCircle, Clock, Upload, Loader2, Plus, FileText, Image, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/uploadFile';
import { toast } from 'sonner';
import { Payment, PaymentStatus, PaymentType } from '@/types';
import { cn } from '@/lib/utils';

const PaymentsPage = () => {
  const { projects, addPayment, updateBooth, updatePayment, deletePayment } = useApp();
  const { t } = useLanguage();
  const allBooths = projects.flatMap(p => p.booths);
  const allPayments = allBooths.flatMap(b => b.payments);

  const totalAmount = allPayments.reduce((s, p) => s + p.amount, 0);
  const received = allPayments.reduce((s, p) => s + (p.receivedAmount ?? (p.status === 'received' ? p.amount : 0)), 0);
  const pending = allPayments.reduce((s, p) => s + Math.max(0, p.amount - (p.receivedAmount ?? (p.status === 'received' ? p.amount : 0))), 0);

  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    projects.forEach(p => { initial[p.id] = false; });
    return initial;
  });

  const toggleProject = (id: string) => setOpenProjects(prev => ({ ...prev, [id]: !prev[id] }));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBoothId, setSelectedBoothId] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('deposit');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
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
    } catch (err) {
      console.error('Upload failed:', err);
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
            if (data.totalContract && selectedBoothId) {
              const booth = allBooths.find(b => b.id === selectedBoothId);
              if (booth && data.totalContract > 0) {
                const project = projects.find(p => p.booths.some(b => b.id === selectedBoothId));
                if (project) updateBooth(project.id, { ...booth, totalContract: data.totalContract, contractUrl: documentUrl });
              }
            }
            if (data.depositAmount > 0 && paymentType === 'deposit') setAmount(String(data.depositAmount));
            else if (data.balanceAmount > 0 && paymentType === 'balance') setAmount(String(data.balanceAmount));
            else if (data.depositAmount > 0) setAmount(String(data.depositAmount));
            if (data.invoiceDate) setInvoiceDate(data.invoiceDate);
            if (data.isReceived) setStatus('received');
            else if (data.invoiceDate) setStatus('invoiced');
            if (data.notes) setNotes(data.notes);
            toast.success(t('ai.recognized'));
          }
        } catch (err) {
          console.error('AI analysis failed:', err);
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

  const handleAddPayment = () => {
    if (!selectedBoothId || !amount) {
      toast.error(t('payments.selectBoothAmount'));
      return;
    }
    const payment: Payment = {
      id: '', boothId: selectedBoothId, type: paymentType, amount: Number(amount), status,
      invoiceDate: invoiceDate || undefined, notes: notes || undefined, documentUrl: documentUrl || undefined,
    };
    addPayment(selectedBoothId, payment);
    toast.success(t('payments.saved'));
    resetForm();
    setDialogOpen(false);
  };

  const resetForm = () => {
    setSelectedBoothId(''); setPaymentType('deposit'); setAmount(''); setStatus('pending');
    setInvoiceDate(''); setNotes(''); setDocumentUrl(''); setUploadedFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('payments.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('payments.subtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />{t('payments.addPayment')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{t('payments.addRecord')}</DialogTitle></DialogHeader>
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
                    <FileText className="h-3 w-3" /><span>{t('upload.uploaded')}</span>
                    <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="underline">{t('upload.view')}</a>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('payments.selectBooth')}</Label>
                <Select value={selectedBoothId} onValueChange={setSelectedBoothId}>
                  <SelectTrigger><SelectValue placeholder={t('payments.selectBooth')} /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => p.booths.map(b => (
                      <SelectItem key={b.id} value={b.id}>{p.name} - {b.clientName}</SelectItem>
                    )))}
                  </SelectContent>
                </Select>
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
              <Button className="w-full" onClick={handleAddPayment}>{t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t('payments.totalAmount')} value={`$${totalAmount.toLocaleString()}`} icon={DollarSign} />
        <StatCard title={t('payments.received')} value={`$${received.toLocaleString()}`} icon={CheckCircle} variant="success" />
        <StatCard title={t('payments.pending')} value={`$${pending.toLocaleString()}`} icon={Clock} variant="warning" />
      </div>

      {projects.map(project => {
        const isOpen = openProjects[project.id] ?? false;
        const allPaid = project.booths.length > 0 && project.booths.every(b => {
          if (b.payments.length === 0) return false;
          return b.payments.every(p => {
            const rec = p.receivedAmount ?? (p.status === 'received' ? p.amount : 0);
            return rec >= p.amount && p.amount > 0;
          });
        });

        return (
          <Collapsible key={project.id} open={isOpen} onOpenChange={() => toggleProject(project.id)}>
            <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-border pb-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                {allPaid && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">{t('payments.allReceived')}</span>}
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {project.booths.map(booth => (
                  <div key={booth.id} className="glass-card rounded-lg p-5">
                    <PaymentTracker payments={booth.payments} clientName={booth.clientName} onUpdatePayment={updatePayment} onDeletePayment={deletePayment} />
                    {booth.contractUrl && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Image className="h-3 w-3" />
                        <a href={booth.contractUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{t('payments.viewContract')}</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default PaymentsPage;
