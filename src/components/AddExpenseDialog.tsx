import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { ExpenseMainCategory, ExpenseSubCategory, Expense, categoryStructure } from '@/types';
import { Plus } from 'lucide-react';

const mainCategories = Object.keys(categoryStructure) as ExpenseMainCategory[];

interface AddExpenseDialogProps {
  projectId: string;
  boothId?: string;
}

const AddExpenseDialog = ({ projectId, boothId }: AddExpenseDialogProps) => {
  const { user, addExpense, projects } = useApp();
  const [open, setOpen] = useState(false);
  const [mainCategory, setMainCategory] = useState<ExpenseMainCategory>('差旅');
  const [subCategory, setSubCategory] = useState<ExpenseSubCategory>(categoryStructure['差旅'][0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBooth, setSelectedBooth] = useState(boothId || '');

  const project = projects.find(p => p.id === projectId);

  const handleMainCategoryChange = (cat: ExpenseMainCategory) => {
    setMainCategory(cat);
    setSubCategory(categoryStructure[cat][0]);
    if (cat !== '三方') setSelectedBooth('');
  };

  const handleSubmit = () => {
    if (!amount || !description) return;
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      projectId,
      boothId: mainCategory === '三方' ? selectedBooth : undefined,
      paidBy: user.name,
      mainCategory,
      subCategory,
      amount: parseFloat(amount),
      description,
      date,
    };
    addExpense(expense);
    setOpen(false);
    setAmount('');
    setDescription('');
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
          <Button className="w-full" onClick={handleSubmit}>提交</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
