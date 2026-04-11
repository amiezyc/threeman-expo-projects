import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
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
  const { t } = useLanguage();
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

  const handleAddLog = async () => {
    if (!selectedProject || !date || !profile || submitting) return;
    setSubmitting(true);
    try {
      await addWorkLog({
        id: `wl-${Date.now()}`,
        projectId: selectedProject,
        userId: profile.id,
        userName: profile.name,
        date,
        dailyRate: profile.daily_rate || 250,
        rateType: 'daily',
      });
    } finally {
      setSubmitting(false);
    }
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
        <h2 className="text-2xl font-bold">{t('worklog.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('worklog.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title={t('worklog.totalDays')} value={`${totalDays}${t('employees.days')}`} icon={Calendar} />
        <StatCard title={t('worklog.totalPay')} value={`$${totalPay.toLocaleString()}`} icon={DollarSign} variant="success" />
      </div>

      <div className="glass-card rounded-lg p-5 space-y-4">
        <h4 className="font-semibold">{t('worklog.addLog')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{t('employees.project')}</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue placeholder={t('worklog.selectProject')} /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('employees.date')}</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddLog} className="w-full" disabled={submitting}>
              {submitting ? t('worklog.submitting') : t('worklog.recordLog')}
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-lg p-5">
        <h4 className="font-semibold mb-3">{t('worklog.history')}</h4>
        <div className="space-y-2">
          {myLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">{t('worklog.noLogs')}</p>
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
                    {log.rateType === 'hourly' ? `$${log.dailyRate}${t('employees.perHour')} × ${log.hours || 0}h` : `$${log.dailyRate}${t('employees.perDay')}`}
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
          <DialogHeader><DialogTitle>{t('worklog.editLog')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('employees.project')}</Label>
              <Select value={editProject} onValueChange={setEditProject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('employees.date')}</Label>
              <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('employees.dailyRate')} ($)</Label>
              <Input type="number" value={editRate} onChange={e => setEditRate(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button variant="destructive" onClick={handleDeleteLog} className="gap-1">
              <Trash2 className="h-4 w-4" /> {t('common.delete')}
            </Button>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setEditLog(null)}>{t('common.cancel')}</Button>
              <Button onClick={handleSaveEdit}>{t('common.save')}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkLogPage;
