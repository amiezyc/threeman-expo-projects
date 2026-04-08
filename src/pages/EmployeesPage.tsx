import { useApp } from '@/context/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import StatCard from '@/components/StatCard';

const EmployeesPage = () => {
  const { employees, projects } = useApp();

  const employeeStats = employees.map(emp => {
    const workLogs = projects.flatMap(p => p.workLogs).filter(w => w.userId === emp.id);
    const expenses = projects.flatMap(p => p.expenses).filter(e => e.paidBy === emp.name);
    const totalDays = workLogs.length;
    const totalPay = workLogs.reduce((s, w) => s + w.dailyRate, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    return { ...emp, totalDays, totalPay, totalExpenses };
  });

  const totalLabor = employeeStats.reduce((s, e) => s + e.totalPay, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">员工管理</h2>
        <p className="text-muted-foreground text-sm">员工工时和开销汇总</p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeStats.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>${emp.dailyRate}</TableCell>
                  <TableCell>{emp.totalDays}天</TableCell>
                  <TableCell className="font-semibold">${emp.totalPay.toLocaleString()}</TableCell>
                  <TableCell>${emp.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
