import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatCard from '@/components/StatCard';
import { Calendar, DollarSign } from 'lucide-react';

const WorkLogPage = () => {
  const { user, projects, addWorkLog } = useApp();
  const allBooths = projects.flatMap(p => p.booths);
  const myLogs = projects.flatMap(p => p.workLogs).filter(w => w.userId === user.id);
  const totalDays = myLogs.length;
  const totalPay = myLogs.reduce((s, w) => s + w.dailyRate, 0);

  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddLog = () => {
    if (!selectedProject || !date) return;
    addWorkLog({
      id: `wl-${Date.now()}`,
      projectId: selectedProject,
      userId: user.id,
      userName: user.name,
      date,
      dailyRate: user.dailyRate || 250,
    });
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
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
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
              <div key={log.id} className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{log.date}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{projects.find(p => p.id === log.projectId)?.name}</span>
                  <span className="font-bold">${log.dailyRate}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkLogPage;
