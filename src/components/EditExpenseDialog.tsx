import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { ExpenseMainCategory, ExpenseSubCategory, Expense, categoryStructure } from '@/types';
import { Trash2, Upload, X, Image } from 'lucide-react';

const mainCategories = Object.keys(categoryStructure) as ExpenseMainCategory[];

interface EditExpenseDialogProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditExpenseDialog = ({ expense, open, onOpenChange }: EditExpenseDialogProps) => {
  const { updateExpense, deleteExpense, projects } = useApp();
  const [mainCategory, setMainCategory] = useState<ExpenseMainCategory>(expense.mainCategory);
  const [subCategory, setSubCategory] = useState<ExpenseSubCategory>(expense.subCategory);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [description, setDescription] = useState(expense.description);
  const [date, setDate] = useState(expense.date);
  const [paidBy, setPaidBy] = useState(expense.paidBy);
  const [selectedBooth, setSelectedBooth] = useState(expense.boothId || '');
  const [receiptUrl, setReceiptUrl] = useState(expense.receiptUrl || '');
  const [receiptPreview, setReceiptPreview] = useState(expense.receiptUrl || '');

  const project = projects.find(p => p.id === expense.projectId);

  const handleMainCategoryChange = (cat: ExpenseMainCategory) => {
    setMainCategory(cat);
    setSubCategory(categoryStructure[cat][0]);
    if (cat !== '三方') setSelectedBooth('');
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setReceiptUrl(result);
      setReceiptPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl('');
    setReceiptPreview('');
  };

  const handleSubmit = () => {
    if (!amount || !description) return;
    updateExpense({
      ...expense,
      mainCategory,
      subCategory,
      amount: parseFloat(amount),
      description,
      date,
      paidBy,
      boothId: mainCategory === '三方' ? selectedBooth : undefined,
      receiptUrl: receiptUrl || undefined,
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
        <DialogHeader>
          <DialogTitle>编辑开销</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>日期</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>支付人</Label>
              <Input value={paidBy} onChange={e => setPaidBy(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>大类</Label>
              <Select value={mainCategory} onValueChange={v => handleMainCategoryChange(v as ExpenseMainCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mainCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>小类</Label>
              <Select value={subCategory} onValueChange={v => setSubCategory(v as ExpenseSubCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryStructure[mainCategory].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
          <div className="space-y-2">
            <Label>金额 ($)</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>说明</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {/* Receipt upload */}
          <div className="space-y-2">
            <Label>收据/Receipt</Label>
            {receiptPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-contain bg-muted" />
                <button
                  onClick={handleRemoveReceipt}
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

          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;
