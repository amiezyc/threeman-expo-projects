import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, Plus, Pencil } from 'lucide-react';
import StatCard from '@/components/StatCard';
import EmployeeDialog from '@/components/EmployeeDialog';
import { User } from '@/types';

const EmployeesPage = () => {
  const { employees, projects, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);

  const employeeStats = employees.map(emp => {
    const workLogs = projects.flatMap(p => p.workLogs).filter(w => w.userId === emp.id);
    const expenses = projects.flatMap(p => p.expenses).filter(e => e.paidBy === emp.name);
    const totalDays = workLogs.length;
    const totalPay = workLogs.reduce((s, w) => s + w.dailyRate, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    return { ...emp, totalDays, totalPay, totalExpenses };
  });

  const totalLabor = employeeStats.reduce((s, e) => s + e.totalPay, 0);

  const handleSave = (emp: User) => {
    if (editingEmployee) {
      updateEmployee(emp);
    } else {
      addEmployee(emp);
    }
    setEditingEmployee(null);
  };

  const handleEdit = (emp: User) => {
    setEditingEmployee(emp);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">员工管理</h2>
          <p className="text-muted-foreground text-sm">员工工时和开销汇总</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" /> 添加员工
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="员工总数" value={`${employees.length}`} icon={Users} />
        <StatCard title="人工总费用" value={`$${totalLabor.toLocaleString()}`} icon={Users} variant="warning" />
      </div>

      <div className="glass-card rounded-lg p-5">
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>姓名</TableHead>
                <TableHead>日薪</TableHead>
                <TableHead>工作天数</TableHead>
                <TableHead>人工费合计</TableHead>
                <TableHead>垫付开销</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeStats.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>${emp.dailyRate ?? '-'}</TableCell>
                  <TableCell>{emp.totalDays}天</TableCell>
                  <TableCell className="font-semibold">${emp.totalPay.toLocaleString()}</TableCell>
                  <TableCell>${emp.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editingEmployee}
        onSave={handleSave}
        onDelete={deleteEmployee}
      />
    </div>
  );
};

export default EmployeesPage;
