import { useState, useMemo, useRef } from 'react';
import { useApp } from '@/context/AppContext';
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
import { Payment, PaymentStatus, Booth } from '@/types';
import { cn } from '@/lib/utils';

const PaymentsPage = () => {
  const { projects, addPayment, updateBooth, updatePayment, deletePayment } = useApp();
  const allBooths = projects.flatMap(p => p.booths);
  const allPayments = allBooths.flatMap(b => b.payments);

  const totalAmount = allPayments.reduce((s, p) => s + p.amount, 0);
  const received = allPayments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const pending = allPayments.filter(p => p.status !== 'received').reduce((s, p) => s + p.amount, 0);

  // Collapsible state: default collapsed, auto-collapse if all deposit+balance received
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    projects.forEach(p => {
      const allPaid = p.booths.every(b => {
        const hasDeposit = b.payments.some(pay => pay.type === 'deposit' && pay.status === 'received');
        const hasBalance = b.payments.some(pay => pay.type === 'balance' && pay.status === 'received');
        return b.payments.length > 0 && hasDeposit && hasBalance;
      });
      initial[p.id] = !allPaid; // collapsed if all paid, open otherwise — but default collapsed
      initial[p.id] = false; // default all collapsed
    });
    return initial;
  });

  const toggleProject = (id: string) => {
    setOpenProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBoothId, setSelectedBoothId] = useState('');
  const [paymentType, setPaymentType] = useState<'deposit' | 'balance'>('deposit');
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
      toast.success('文件已上传');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async () => {
    if (!uploadedFile) { toast.error('请先上传文件'); return; }
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const { data, error } = await supabase.functions.invoke('analyze-contract', {
            body: { imageBase64: base64 },
          });
          if (error) throw error;
          if (data) {
            if (data.totalContract && selectedBoothId) {
              const booth = allBooths.find(b => b.id === selectedBoothId);
              if (booth && data.totalContract > 0) {
                const project = projects.find(p => p.booths.some(b => b.id === selectedBoothId));
                if (project) {
                  updateBooth(project.id, { ...booth, totalContract: data.totalContract, contractUrl: documentUrl });
                }
              }
            }
            if (data.depositAmount > 0 && paymentType === 'deposit') {
              setAmount(String(data.depositAmount));
            } else if (data.balanceAmount > 0 && paymentType === 'balance') {
              setAmount(String(data.balanceAmount));
            } else if (data.depositAmount > 0) {
              setAmount(String(data.depositAmount));
            }
            if (data.invoiceDate) setInvoiceDate(data.invoiceDate);
            if (data.isReceived) setStatus('received');
            else if (data.invoiceDate) setStatus('invoiced');
            if (data.notes) setNotes(data.notes);
            toast.success('AI识别完成，请确认信息后保存');
          }
        } catch (err) {
          console.error('AI analysis failed:', err);
          toast.error('AI识别失败，请手动填写');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(uploadedFile);
    } catch (err) {
      toast.error('识别失败');
      setAnalyzing(false);
    }
  };

  const handleAddPayment = () => {
    if (!selectedBoothId || !amount) {
      toast.error('请选择展位并填写金额');
      return;
    }
    const payment: Payment = {
      id: '',
      boothId: selectedBoothId,
      type: paymentType,
      amount: Number(amount),
      status,
      invoiceDate: invoiceDate || undefined,
      notes: notes || undefined,
      documentUrl: documentUrl || undefined,
    };
    addPayment(selectedBoothId, payment);
    toast.success('款项已添加');
    resetForm();
    setDialogOpen(false);
  };

  const resetForm = () => {
    setSelectedBoothId('');
    setPaymentType('deposit');
    setAmount('');
    setStatus('pending');
    setInvoiceDate('');
    setNotes('');
    setDocumentUrl('');
    setUploadedFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">收款追踪</h2>
          <p className="text-muted-foreground text-sm">管理所有客户的收款进度</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />添加款项</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加收款记录</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>上传合同/Invoice</Label>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中...</> : <><Upload className="h-4 w-4 mr-2" />选择文件</>}
                  </Button>
                  <Button variant="secondary" onClick={handleExtract} disabled={!uploadedFile || analyzing} title="AI自动识别合同/Invoice信息">
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-1">识别</span>
                  </Button>
                </div>
                {documentUrl && (
                  <div className="flex items-center gap-2 text-xs text-success">
                    <FileText className="h-3 w-3" />
                    <span>文件已上传</span>
                    <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="underline">查看</a>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>选择展位</Label>
                <Select value={selectedBoothId} onValueChange={setSelectedBoothId}>
                  <SelectTrigger><SelectValue placeholder="选择展位" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => p.booths.map(b => (
                      <SelectItem key={b.id} value={b.id}>{p.name} - {b.clientName}</SelectItem>
                    )))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={paymentType} onValueChange={(v) => setPaymentType(v as 'deposit' | 'balance')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">首款 (Deposit)</SelectItem>
                    <SelectItem value="balance">尾款 (Balance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>金额 ($)</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="invoiced">已开票</SelectItem>
                    <SelectItem value="received">已收款</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice 日期</Label>
                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="备注信息" rows={2} />
              </div>
              <Button className="w-full" onClick={handleAddPayment}>保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="总金额" value={`$${totalAmount.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="已收款" value={`$${received.toLocaleString()}`} icon={CheckCircle} variant="success" />
        <StatCard title="待收款" value={`$${pending.toLocaleString()}`} icon={Clock} variant="warning" />
      </div>

      {projects.map(project => {
        const isOpen = openProjects[project.id] ?? false;
        const allPaid = project.booths.length > 0 && project.booths.every(b => {
          const hasDeposit = b.payments.some(pay => pay.type === 'deposit' && pay.status === 'received');
          const hasBalance = b.payments.some(pay => pay.type === 'balance' && pay.status === 'received');
          return b.payments.length > 0 && hasDeposit && hasBalance;
        });

        return (
          <Collapsible key={project.id} open={isOpen} onOpenChange={() => toggleProject(project.id)}>
            <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-border pb-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                {allPaid && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">全部已收</span>}
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
                        <a href={booth.contractUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">查看合同</a>
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
