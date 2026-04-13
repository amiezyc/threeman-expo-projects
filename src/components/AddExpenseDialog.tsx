import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCategories } from '@/hooks/useCategories';
import { Expense } from '@/types';
import { Plus, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddExpenseDialogProps {
  projectId: string;
  boothId?: string;
}

const AddExpenseDialog = ({ projectId, boothId }: AddExpenseDialogProps) => {
  const { addExpense, projects } = useApp();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { mainCategories, getSubCategories, loading: catsLoading } = useCategories();

  const [open, setOpen] = useState(false);
  const [mainCategoryId, setMainCategoryId] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [amount, setAmount] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBooth, setSelectedBooth] = useState(boothId || '');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isClientCost, setIsClientCost] = useState(false);

  const project = projects.find(p => p.id === projectId);
  const selectedMain = mainCategories.find(c => c.id === mainCategoryId);
  const selectedMainName = selectedMain?.name || '';
  const subCats = mainCategoryId ? getSubCategories(mainCategoryId) : [];
  const isWeighType = subCategoryName === '过磅';

  // Set defaults when categories load
  useEffect(() => {
    if (mainCategories.length > 0 && !mainCategoryId) {
      setMainCategoryId(mainCategories[0].id);
      const subs = getSubCategories(mainCategories[0].id);
      if (subs.length > 0) setSubCategoryName(subs[0].name);
    }
  }, [mainCategories, mainCategoryId, getSubCategories]);

  // Auto-calc amount for 过磅
  useEffect(() => {
    if (isWeighType && unitPrice && weight) {
      setAmount((parseFloat(unitPrice) * parseFloat(weight)).toFixed(2));
    }
  }, [unitPrice, weight, isWeighType]);

  const handleMainChange = (id: string) => {
    setMainCategoryId(id);
    const subs = getSubCategories(id);
    setSubCategoryName(subs.length > 0 ? subs[0].name : '');
    setUnitPrice('');
    setWeight('');
  };

  const handleSubChange = (name: string) => {
    setSubCategoryName(name);
    if (name !== '过磅') { setUnitPrice(''); setWeight(''); }
  };

  const catDisplayName = (name: string) => {
    const key = `cat.${name}` as any;
    const val = t(key);
    return val !== key ? val : name;
  };

  const analyzeReceipt = async (base64: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-receipt', { body: { imageBase64: base64 } });
      if (error) throw error;
      if (data && !data.error) {
        // Try to match main category by name
        const mc = mainCategories.find(c => c.name === data.mainCategory);
        if (mc) {
          setMainCategoryId(mc.id);
          const subs = getSubCategories(mc.id);
          const matchSub = subs.find(s => s.name === data.subCategory);
          setSubCategoryName(matchSub ? matchSub.name : (subs[0]?.name || ''));
        }
        if (data.amount) setAmount(String(data.amount));
        if (data.description) setDescription(data.description);
        toast.success(t('ai.receiptRecognized'));
      }
    } catch (e) {
      console.error('Receipt analysis failed:', e);
      toast.error(t('ai.receiptFailed'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setReceiptPreview(base64);
      analyzeReceipt(base64);
    };
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const { uploadFile } = await import('@/lib/uploadFile');
      const { url } = await uploadFile('receipts', projectId, file);
      setReceiptUrl(url);
    } catch { /* ignore */ }
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!amount || !description) return;
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      projectId,
      boothId: selectedMainName === '三方' ? selectedBooth : undefined,
      paidBy: profile?.name || '',
      mainCategory: selectedMainName as any,
      subCategory: subCategoryName as any,
      amount: parseFloat(amount),
      description,
      date,
      receiptUrl: receiptUrl || undefined,
      isClientCost: selectedMainName === '三方' ? isClientCost : false,
      unitPrice: isWeighType && unitPrice ? parseFloat(unitPrice) : undefined,
      weight: isWeighType && weight ? parseFloat(weight) : undefined,
    };
    addExpense(expense);
    setOpen(false);
    setAmount(''); setDescription(''); setReceiptUrl(''); setReceiptPreview('');
    setIsClientCost(false); setUnitPrice(''); setWeight('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{t('expenses.addExpense')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('expenses.addExpense')}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Receipt upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {t('upload.receiptLabel')}
              {analyzing && <span className="flex items-center gap-1 text-xs text-primary"><Loader2 className="h-3 w-3 animate-spin" />{t('ai.recognizing')}</span>}
              {uploading && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t('upload.uploading')}</span>}
              {!analyzing && !uploading && <span className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3" />{t('ai.autoRecognize')}</span>}
            </Label>
            {receiptPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-contain bg-muted" />
                <button onClick={() => { setReceiptUrl(''); setReceiptPreview(''); }} className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('upload.receipt')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('expenses.date')}</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('expenses.mainCategory')}</Label>
              <Select value={mainCategoryId} onValueChange={handleMainChange} disabled={catsLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mainCategories.map(c => <SelectItem key={c.id} value={c.id}>{catDisplayName(c.name)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('expenses.subCategory')}</Label>
              <Select value={subCategoryName} onValueChange={handleSubChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subCats.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedMainName === '三方' && project && (
              <div className="space-y-2">
                <Label>{t('expenses.booth')}</Label>
                <Select value={selectedBooth} onValueChange={setSelectedBooth}>
                  <SelectTrigger><SelectValue placeholder={t('expenses.selectBooth')} /></SelectTrigger>
                  <SelectContent>
                    {project.booths.map(b => <SelectItem key={b.id} value={b.id}>{b.clientName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {isWeighType && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('expenses.autoCalc')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">{t('expenses.unitPrice')}</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('expenses.weight')}</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('expenses.amount')}</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} disabled={isWeighType && !!unitPrice && !!weight} />
          </div>

          {selectedMainName === '三方' && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm">{t('expenses.isClientCost')}</Label>
              <Switch checked={isClientCost} onCheckedChange={setIsClientCost} />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('expenses.description')}</Label>
            <Input placeholder={t('expenses.descriptionPlaceholder')} value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={analyzing || uploading}>{t('expenses.submit')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
