import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/types';
import { toast } from 'sonner';

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: User | null;
  onSave: (employee: User) => void;
  onDelete?: (id: string) => void;
}

const EmployeeDialog = ({ open, onOpenChange, employee, onSave, onDelete }: EmployeeDialogProps) => {
  const [name, setName] = useState('');
  const [dailyRate, setDailyRate] = useState('');

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setDailyRate(String(employee.dailyRate ?? ''));
    } else {
      setName('');
      setDailyRate('');
    }
  }, [employee, open]);

  const autoSave = useCallback(() => {
    if (!employee || !name.trim()) return;
    const updated: User = {
      id: employee.id,
      name: name.trim(),
      role: 'employee',
      dailyRate: dailyRate ? Number(dailyRate) : undefined,
    };
    if (updated.name !== employee.name || updated.dailyRate !== employee.dailyRate) {
      onSave(updated);
      toast.success('已自动保存');
    }
  }, [employee, name, dailyRate, onSave]);

  // Auto-save on close for existing employees
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && employee) {
      autoSave();
    }
    onOpenChange(isOpen);
  };

  const handleSaveNew = () => {
    if (!name.trim()) return;
    onSave({
      id: `emp-${Date.now()}`,
      name: name.trim(),
      role: 'employee',
      dailyRate: dailyRate ? Number(dailyRate) : undefined,
    });
    onOpenChange(false);
    toast.success('员工已添加');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? '编辑员工' : '添加员工'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>姓名</Label>
            <Input value={name} onChange={e => setName(e.target.value)} onBlur={employee ? autoSave : undefined} placeholder="员工姓名" />
          </div>
          <div className="space-y-2">
            <Label>日薪 ($)</Label>
            <Input type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} onBlur={employee ? autoSave : undefined} placeholder="每天工资" />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          {employee && onDelete && (
            <Button variant="destructive" onClick={() => { onDelete(employee.id); onOpenChange(false); }}>
              删除
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {!employee && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                <Button onClick={handleSaveNew} disabled={!name.trim()}>添加</Button>
              </>
            )}
            {employee && (
              <Button variant="outline" onClick={() => handleOpenChange(false)}>关闭</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDialog;
