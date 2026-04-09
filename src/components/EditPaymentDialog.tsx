import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, FileText, Sparkles } from 'lucide-react';
import { Payment, PaymentStatus } from '@/types';
import { uploadFile } from '@/lib/uploadFile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditPaymentDialogProps {
  payment: Payment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payment: Payment) => void;
}

const EditPaymentDialog = ({ payment, open, onOpenChange, onSave }: EditPaymentDialogProps) => {
  const [paymentType, setPaymentType] = useState(payment.type);
  const [amount, setAmount] = useState(String(payment.amount));
  const [status, setStatus] = useState<PaymentStatus>(payment.status);
  const [invoiceDate, setInvoiceDate] = useState(payment.invoiceDate || '');
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
      toast.success('文件已上传');
    } catch {
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
            if (data.depositAmount > 0 && paymentType === 'deposit') setAmount(String(data.depositAmount));
            else if (data.balanceAmount > 0 && paymentType === 'balance') setAmount(String(data.balanceAmount));
            else if (data.depositAmount > 0) setAmount(String(data.depositAmount));
            if (data.invoiceDate) setInvoiceDate(data.invoiceDate);
            if (data.isReceived) setStatus('received');
            else if (data.invoiceDate) setStatus('invoiced');
            if (data.notes) setNotes(data.notes);
            toast.success('AI识别完成');
          }
        } catch {
          toast.error('AI识别失败');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(uploadedFile);
    } catch {
      toast.error('识别失败');
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!amount) { toast.error('请填写金额'); return; }
    onSave({
      ...payment,
      type: paymentType,
      amount: Number(amount),
      status,
      invoiceDate: invoiceDate || undefined,
      notes: notes || undefined,
      documentUrl: documentUrl || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑款项</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>上传合同/Invoice</Label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中...</> : <><Upload className="h-4 w-4 mr-2" />选择文件</>}
              </Button>
              <Button variant="secondary" onClick={handleExtract} disabled={!uploadedFile || analyzing}>
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

          <Button className="w-full" onClick={handleSave}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPaymentDialog;
