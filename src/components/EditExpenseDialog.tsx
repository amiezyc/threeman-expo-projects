import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCategories } from '@/hooks/useCategories';
import { Expense } from '@/types';
import { Trash2, Upload, X, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface EditExpenseDialogProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditExpenseDialog = ({ expense, open, onOpenChange }: EditExpenseDialogProps) => {
  const { updateExpense, deleteExpense, projects } = useApp();
  const { t } = useLanguage();
  const { mainCategories, getSubCategories } = useCategories();

  // Find main category id by name
  const initMainId = mainCategories.find(c => c.name === expense.mainCategory)?.id || '';

  const [mainCategoryId, setMainCategoryId] = useState(initMainId);
  const [subCategoryName, setSubCategoryName] = useState(expense.subCategory);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [unitPrice, setUnitPrice] = useState(expense.unitPrice?.toString() || '');
  const [weight, setWeight] = useState(expense.weight?.toString() || '');
  const [description, setDescription] = useState(expense.description);
  const [date, setDate] = useState(expense.date);
  const [paidBy, setPaidBy] = useState(expense.paidBy);
  const [selectedBooth, setSelectedBooth] = useState(expense.boothId || '');
  const [receiptUrl, setReceiptUrl] = useState(expense.receiptUrl || '');
  const [receiptPreview, setReceiptPreview] = useState(expense.receiptUrl || '');
  const [uploading, setUploading] = useState(false);
  const [isClientCost, setIsClientCost] = useState(expense.isClientCost ?? false);

  const project = projects.find(p => p.id === expense.projectId);
  const selectedMain = mainCategories.find(c => c.id === mainCategoryId);
  const selectedMainName = selectedMain?.name || expense.mainCategory;
  const subCats = mainCategoryId ? getSubCategories(mainCategoryId) : [];
  const isWeighType = subCategoryName === '过磅';

  // Update mainCategoryId when categories load
  useEffect(() => {
    if (mainCategories.length > 0 && !mainCategoryId) {
      const found = mainCategories.find(c => c.name === expense.mainCategory);
      if (found) setMainCategoryId(found.id);
    }
  }, [mainCategories, mainCategoryId, expense.mainCategory]);

  // Auto-calc for 过磅
  useEffect(() => {
    if (isWeighType && unitPrice && weight) {
      setAmount((parseFloat(unitPrice) * parseFloat(weight)).toFixed(2));
    }
  }, [unitPrice, weight, isWeighType]);

  const catDisplayName = (name: string) => {
    const key = `cat.${name}` as any;
    const val = t(key);
    return val !== key ? val : name;
  };

  const handleMainChange = (id: string) => {
    setMainCategoryId(id);
    const subs = getSubCategories(id);
    setSubCategoryName(subs.length > 0 ? subs[0].name : '');
    setUnitPrice(''); setWeight('');
  };

  const handleSubChange = (name: string) => {
    setSubCategoryName(name);
    if (name !== '过磅') { setUnitPrice(''); setWeight(''); }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const { uploadFile } = await import('@/lib/uploadFile');
      const { url } = await uploadFile('receipts', expense.projectId, file);
      setReceiptUrl(url);
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!amount || !description) return;
    updateExpense({
      ...expense,
      mainCategory: selectedMainName as any,
      subCategory: subCategoryName as any,
      amount: parseFloat(amount),
      description, date, paidBy,
      boothId: selectedMainName === '三方' ? selectedBooth : undefined,
      receiptUrl: receiptUrl || undefined,
      isClientCost: selectedMainName === '三方' ? isClientCost : false,
      unitPrice: isWeighType && unitPrice ? parseFloat(unitPrice) : undefined,
      weight: isWeighType && weight ? parseFloat(weight) : undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteExpense(expense.projectId, expense.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t('expenses.editExpense')}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('expenses.date')}</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('expenses.payer')}</Label>
              <Input value={paidBy} onChange={e => setPaidBy(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('expenses.mainCategory')}</Label>
              <Select value={mainCategoryId} onValueChange={handleMainChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mainCategories.map(c => <SelectItem key={c.id} value={c.id}>{catDisplayName(c.name)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('expenses.subCategory')}</Label>
              <Select value={subCategoryName} onValueChange={handleSubChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subCats.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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

          {isWeighType && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('expenses.autoCalc')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">{t('expenses.unitPrice')}</Label>
                  <Input type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('expenses.weight')}</Label>
                  <Input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('expenses.amount')}</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} disabled={isWeighType && !!unitPrice && !!weight} />
          </div>
          {selectedMainName === '三方' && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm">{t('expenses.isClientCost')}</Label>
              <Switch checked={isClientCost} onCheckedChange={setIsClientCost} />
            </div>
          )}
          <div className="space-y-2">
            <Label>{t('expenses.description')}</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {t('upload.receiptLabel')}
              {uploading && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t('upload.uploading')}</span>}
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
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
              <Trash2 className="h-4 w-4" /> {t('common.delete')}
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={uploading}>{t('common.save')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;
