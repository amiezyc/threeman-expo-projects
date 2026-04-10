import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import StatCard from '@/components/StatCard';
import { Calendar, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { WorkLog } from '@/types';

const WorkLogPage = () => {
  const { profile } = useAuth();
  const { projects, addWorkLog, updateWorkLog, deleteWorkLog } = useApp();
  const myLogs = projects.flatMap(p => p.workLogs).filter(w => w.userId === profile?.id);
  const totalDays = myLogs.length;
  const totalPay = myLogs.reduce((s, w) => s + (w.rateType === 'hourly' ? w.dailyRate * (w.hours || 0) : w.dailyRate), 0);

  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const [editLog, setEditLog] = useState<WorkLog | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editProject, setEditProject] = useState('');

  const handleAddLog = () => {
    if (!selectedProject || !date || !profile) return;
    addWorkLog({
      id: `wl-${Date.now()}`,
      projectId: selectedProject,
      userId: profile.id,
      userName: profile.name,
      date,
      dailyRate: profile.daily_rate || 250,
      rateType: 'daily',
    });
  };

  const openEdit = (log: WorkLog) => {
    setEditLog(log);
    setEditDate(log.date);
    setEditRate(String(log.dailyRate));
    setEditProject(log.projectId);
  };

  const handleSaveEdit = () => {
    if (!editLog) return;
    updateWorkLog({ ...editLog, date: editDate, dailyRate: Number(editRate), projectId: editProject });
    setEditLog(null);
  };

  const handleDeleteLog = () => {
    if (!editLog) return;
    deleteWorkLog(editLog.projectId, editLog.id);
    setEditLog(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">工时记录</h2>
        <p className="text-muted-foreground text-sm">记录你的工作天数</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="总工作天数" value={`${totalDays}天`} icon={Calendar} />
        <StatCard title="应得工资" value={`$${totalPay.toLocaleString()}`} icon={DollarSign} variant="success" />
      </div>

      <div className="glass-card rounded-lg p-5 space-y-4">
        <h4 className="font-semibold">添加工时</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>项目</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue placeholder="选择项目" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>日期</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddLog} className="w-full">记录工时</Button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-lg p-5">
        <h4 className="font-semibold mb-3">工时历史</h4>
        <div className="space-y-2">
          {myLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">暂无工时记录</p>
          ) : (
            myLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-4 py-3 group">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{log.date}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{projects.find(p => p.id === log.projectId)?.name}</span>
                  <span className="font-bold">
                    {log.rateType === 'hourly' ? `$${log.dailyRate}/hr × ${log.hours || 0}h` : `$${log.dailyRate}/天`}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => openEdit(log)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!editLog} onOpenChange={open => !open && setEditLog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>编辑工时</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>项目</Label>
              <Select value={editProject} onValueChange={setEditProject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>日期</Label>
              <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>日薪 ($)</Label>
              <Input type="number" value={editRate} onChange={e => setEditRate(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button variant="destructive" onClick={handleDeleteLog} className="gap-1">
              <Trash2 className="h-4 w-4" /> 删除
            </Button>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setEditLog(null)}>取消</Button>
              <Button onClick={handleSaveEdit}>保存</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkLogPage;
