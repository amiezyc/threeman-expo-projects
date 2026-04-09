import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ExpenseMainCategory, ExpenseSubCategory, Expense, categoryStructure } from '@/types';
import { Plus, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const mainCategories = Object.keys(categoryStructure) as ExpenseMainCategory[];

interface AddExpenseDialogProps {
  projectId: string;
  boothId?: string;
}

const AddExpenseDialog = ({ projectId, boothId }: AddExpenseDialogProps) => {
  const { addExpense, projects } = useApp();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [mainCategory, setMainCategory] = useState<ExpenseMainCategory>('差旅');
  const [subCategory, setSubCategory] = useState<ExpenseSubCategory>(categoryStructure['差旅'][0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBooth, setSelectedBooth] = useState(boothId || '');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const project = projects.find(p => p.id === projectId);

  const handleMainCategoryChange = (cat: ExpenseMainCategory) => {
    setMainCategory(cat);
    setSubCategory(categoryStructure[cat][0]);
    if (cat !== '三方') setSelectedBooth('');
  };

  const analyzeReceipt = async (base64: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-receipt', {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data && !data.error) {
        const mc = data.mainCategory as ExpenseMainCategory;
        if (categoryStructure[mc]) {
          setMainCategory(mc);
          const validSub = categoryStructure[mc].includes(data.subCategory as ExpenseSubCategory);
          setSubCategory(validSub ? data.subCategory : categoryStructure[mc][0]);
        }
        if (data.amount) setAmount(String(data.amount));
        if (data.description) setDescription(data.description);
        toast.success('AI已自动识别收据内容');
      }
    } catch (e) {
      console.error('Receipt analysis failed:', e);
      toast.error('收据识别失败，请手动填写');
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadReceiptToStorage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${projectId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('receipts').upload(path, file);
    if (error) {
      console.error('Upload failed:', error);
      return null;
    }
    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setReceiptPreview(base64);
      analyzeReceipt(base64);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    setUploading(true);
    const url = await uploadReceiptToStorage(file);
    if (url) {
      setReceiptUrl(url);
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!amount || !description) return;
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      projectId,
      boothId: mainCategory === '三方' ? selectedBooth : undefined,
      paidBy: profile?.name || '',
      mainCategory,
      subCategory,
      amount: parseFloat(amount),
      description,
      date,
      receiptUrl: receiptUrl || undefined,
    };
    addExpense(expense);
    setOpen(false);
    setAmount('');
    setDescription('');
    setReceiptUrl('');
    setReceiptPreview('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          添加开销
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加开销</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              收据/Receipt
              {analyzing && <span className="flex items-center gap-1 text-xs text-primary"><Loader2 className="h-3 w-3 animate-spin" />AI识别中...</span>}
              {uploading && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />上传中...</span>}
              {!analyzing && !uploading && <span className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3" />上传后AI自动识别</span>}
            </Label>
            {receiptPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-contain bg-muted" />
                <button
                  onClick={() => { setReceiptUrl(''); setReceiptPreview(''); }}
                  className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">上传收据图片</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>日期</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>大类</Label>
              <Select value={mainCategory} onValueChange={v => handleMainCategoryChange(v as ExpenseMainCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mainCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>小类</Label>
              <Select value={subCategory} onValueChange={v => setSubCategory(v as ExpenseSubCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryStructure[mainCategory].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {mainCategory === '三方' && project && (
              <div className="space-y-2">
                <Label>展位</Label>
                <Select value={selectedBooth} onValueChange={setSelectedBooth}>
                  <SelectTrigger><SelectValue placeholder="选择展位" /></SelectTrigger>
                  <SelectContent>
                    {project.booths.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.clientName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>金额 ($)</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>说明</Label>
            <Input placeholder="开销说明..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={analyzing || uploading}>提交</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
