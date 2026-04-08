import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { ExpenseCategory, Expense } from '@/types';
import { Plus } from 'lucide-react';

const categories: ExpenseCategory[] = ['材料费', '运输费', '人工费', '设计费', '印刷费', '设备租赁', '餐饮住宿', '其他'];

interface AddExpenseDialogProps {
  boothId: string;
  projectId: string;
}

const AddExpenseDialog = ({ boothId, projectId }: AddExpenseDialogProps) => {
  const { user, addExpense } = useApp();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('材料费');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!amount || !description) return;
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      projectId,
      boothId,
      userId: user.id,
      userName: user.name,
      category,
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
              <Label>类别</Label>
              <Select value={category} onValueChange={v => setCategory(v as ExpenseCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>金额 ($)</Label>
            <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
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
