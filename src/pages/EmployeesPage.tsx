import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Users, Plus, Pencil, Calendar as CalendarIcon, Trash2, Clock } from 'lucide-react';
import StatCard from '@/components/StatCard';
import EmployeeDialog from '@/components/EmployeeDialog';
import { User, WorkLog, RateType } from '@/types';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const EmployeesPage = () => {
  const { employees, projects, addEmployee, updateEmployee, deleteEmployee, addWorkLog, updateWorkLog, deleteWorkLog } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);

  // Work log management
  const [workLogEmployee, setWorkLogEmployee] = useState<User | null>(null);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [logDate, setLogDate] = useState('');
  const [logRate, setLogRate] = useState('');
  const [logProject, setLogProject] = useState('');

  // Multi-date add
  const [addingLog, setAddingLog] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [newLogProject, setNewLogProject] = useState(projects[0]?.id || '');

  const employeeStats = employees.map(emp => {
    const workLogs = projects.flatMap(p => p.workLogs).filter(w => w.userId === emp.id);
    const expenses = projects.flatMap(p => p.expenses).filter(e => e.paidBy === emp.name);
    const totalDays = workLogs.length;
    const totalPay = workLogs.reduce((s, w) => s + w.dailyRate, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    return { ...emp, totalDays, totalPay, totalExpenses, workLogs };
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

  const openWorkLogs = (emp: User) => {
    setWorkLogEmployee(emp);
    setEditingLog(null);
    setAddingLog(false);
    setSelectedDates([]);
  };

  const startEditLog = (log: WorkLog) => {
    setEditingLog(log);
    setLogDate(log.date);
    setLogRate(String(log.dailyRate));
    setLogProject(log.projectId);
  };

  const saveEditLog = () => {
    if (!editingLog) return;
    updateWorkLog({ ...editingLog, date: logDate, dailyRate: Number(logRate), projectId: logProject });
    setEditingLog(null);
    toast.success('工时已更新');
  };

  const handleDeleteLog = (log: WorkLog) => {
    deleteWorkLog(log.projectId, log.id);
    toast.success('工时已删除');
  };

  const handleAddLogs = () => {
    if (!workLogEmployee || !newLogProject || selectedDates.length === 0) return;
    selectedDates.forEach(date => {
      addWorkLog({
        id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        projectId: newLogProject,
        userId: workLogEmployee.id,
        userName: workLogEmployee.name,
        date: format(date, 'yyyy-MM-dd'),
        dailyRate: workLogEmployee.dailyRate || 250,
      });
    });
    setAddingLog(false);
    setSelectedDates([]);
    toast.success(`已添加 ${selectedDates.length} 天工时`);
  };

  const empWorkLogs = workLogEmployee
    ? projects.flatMap(p => p.workLogs).filter(w => w.userId === workLogEmployee.id)
    : [];

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
                  <TableCell>
                    <button
                      onClick={() => openWorkLogs(emp)}
                      className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
                    >
                      {emp.totalDays}天
                      <Pencil className="h-3 w-3" />
                    </button>
                  </TableCell>
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

      {/* Work Log Management Dialog */}
      <Dialog open={!!workLogEmployee} onOpenChange={open => !open && setWorkLogEmployee(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{workLogEmployee?.name} - 工时记录 ({empWorkLogs.length}天)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {empWorkLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">暂无工时记录</p>
            ) : (
              empWorkLogs.map(log => (
                <div key={log.id} className="rounded-md border border-border/50 bg-muted/30 px-4 py-3">
                  {editingLog?.id === log.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">项目</Label>
                          <Select value={logProject} onValueChange={setLogProject}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">日期</Label>
                          <Input className="h-8 text-xs" type="date" value={logDate} onChange={e => setLogDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">日薪</Label>
                          <Input className="h-8 text-xs" type="number" value={logRate} onChange={e => setLogRate(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setEditingLog(null)}>取消</Button>
                        <Button size="sm" onClick={saveEditLog}>保存</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.date}</span>
                        <span className="text-xs text-muted-foreground">{projects.find(p => p.id === log.projectId)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">${log.dailyRate}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditLog(log)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteLog(log)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {addingLog ? (
              <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">项目</Label>
                  <Select value={newLogProject} onValueChange={setNewLogProject}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">选择工作日期（可多选）</Label>
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    className="rounded-md border pointer-events-auto"
                  />
                  {selectedDates.length > 0 && (
                    <p className="text-xs text-muted-foreground">已选择 {selectedDates.length} 天</p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => { setAddingLog(false); setSelectedDates([]); }}>取消</Button>
                  <Button size="sm" onClick={handleAddLogs} disabled={selectedDates.length === 0}>
                    添加 {selectedDates.length > 0 ? `${selectedDates.length}天` : ''}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => setAddingLog(true)}>
                <Plus className="h-4 w-4" /> 添加工时
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;
