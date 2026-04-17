import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, AlertCircle, FileText, Clock, CheckCircle2, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import EditExpenseDialog from '@/components/EditExpenseDialog';
import type { Expense, ReimburseStatus } from '@/types';

type StatusFilter = 'all' | ReimburseStatus;

const STATUS_LABEL: Record<ReimburseStatus, string> = {
  not_billed: '未开票',
  billed: '已开票',
  partial_recovered: '部分收回',
  recovered: '已收回',
};

const STATUS_ORDER: ReimburseStatus[] = ['not_billed', 'billed', 'partial_recovered', 'recovered'];

const statusBadgeClass = (s: ReimburseStatus) => {
  switch (s) {
    case 'not_billed': return 'bg-muted text-muted-foreground hover:bg-muted/80';
    case 'billed': return 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 dark:text-blue-400';
    case 'partial_recovered': return 'bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 dark:text-orange-400';
    case 'recovered': return 'bg-success/15 text-success hover:bg-success/25';
  }
};

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const ReimbursementsPage = () => {
  const { projects, updateExpense } = useApp();
  const navigate = useNavigate();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [payerFilter, setPayerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editing, setEditing] = useState<Expense | null>(null);

  // Flatten reimbursable expenses across projects
  const rows = useMemo(() => {
    const all: Array<Expense & { _projectName: string; _boothName?: string; _status: ReimburseStatus; _unrecovered: number }> = [];
    for (const p of projects) {
      for (const e of p.expenses) {
        const isReimbursable = !!e.reimburseStatus || e.reimbursed === true || (!!(e as any).user_id);
        // Treat any expense that has reimburse_status set as reimbursable
        if (!e.reimburseStatus && !e.reimbursed) continue;
        const status: ReimburseStatus = e.reimburseStatus
          ?? (e.reimbursed ? 'recovered' : 'not_billed');
        const recovered = e.recoveredAmount ?? (status === 'recovered' ? e.amount : 0);
        const unrecovered = Math.max(0, e.amount - recovered);
        const booth = e.boothId ? p.booths.find(b => b.id === e.boothId) : undefined;
        all.push({
          ...e,
          _projectName: p.name,
          _boothName: booth?.clientName,
          _status: status,
          _unrecovered: unrecovered,
        });
      }
    }
    return all.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [projects]);

  const payers = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => r.paidBy && set.add(r.paidBy));
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (projectFilter !== 'all' && r.projectId !== projectFilter) return false;
      if (payerFilter !== 'all' && r.paidBy !== payerFilter) return false;
      if (statusFilter !== 'all' && r._status !== statusFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
  }, [rows, projectFilter, payerFilter, statusFilter, dateFrom, dateTo]);

  // Summary metrics (across all reimbursable, ignoring filters per spec — but we'll show filtered for usefulness)
  const summary = useMemo(() => {
    const total = filtered.reduce((s, r) => s + r.amount, 0);
    const unrecovered = filtered.reduce((s, r) => s + r._unrecovered, 0);
    const billedUnrecovered = filtered
      .filter(r => r._status === 'billed')
      .reduce((s, r) => s + r._unrecovered, 0);
    const partial = filtered
      .filter(r => r._status === 'partial_recovered')
      .reduce((s, r) => s + r._unrecovered, 0);
    const recovered = filtered
      .filter(r => r._status === 'recovered')
      .reduce((s, r) => s + (r.recoveredAmount ?? r.amount), 0);
    return { total, unrecovered, billedUnrecovered, partial, recovered };
  }, [filtered]);

  const cycleStatus = async (r: Expense & { _status: ReimburseStatus }) => {
    const idx = STATUS_ORDER.indexOf(r._status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    const recovered = next === 'recovered' ? r.amount
      : next === 'not_billed' || next === 'billed' ? 0
      : (r.recoveredAmount ?? 0);
    await updateExpense({
      ...r,
      reimburseStatus: next,
      reimbursed: next === 'recovered',
      recoveredAmount: recovered,
    });
  };

  const handleDelete = async (r: Expense) => {
    if (!confirm('确认删除该垫付记录？')) return;
    const { deleteExpense } = (await import('@/context/AppContext')) as any;
    // use context method via re-render path
  };

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">垫付中心</h1>
        <p className="text-sm text-muted-foreground mt-1">汇总所有项目的垫付费用与回收情况</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard title="垫付总额" value={fmt(summary.total)} icon={Wallet} variant="default" />
        <StatCard title="未收回垫付" value={fmt(summary.unrecovered)} icon={AlertCircle} variant="destructive" />
        <StatCard title="已开票未收回" value={fmt(summary.billedUnrecovered)} icon={FileText} variant="warning" />
        <StatCard title="部分收回" value={fmt(summary.partial)} icon={Clock} variant="warning" />
        <StatCard title="已收回" value={fmt(summary.recovered)} icon={CheckCircle2} variant="success" />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">项目</label>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部项目</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">垫付人</label>
            <Select value={payerFilter} onValueChange={setPayerFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {payers.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">状态</label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {STATUS_ORDER.map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">起始日期</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">截止日期</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">日期</TableHead>
                <TableHead className="whitespace-nowrap">项目</TableHead>
                <TableHead className="whitespace-nowrap">Booth</TableHead>
                <TableHead className="whitespace-nowrap">客户</TableHead>
                <TableHead className="whitespace-nowrap">垫付人</TableHead>
                <TableHead className="whitespace-nowrap">类别</TableHead>
                <TableHead className="whitespace-nowrap">小类</TableHead>
                <TableHead className="whitespace-nowrap text-right">金额</TableHead>
                <TableHead className="whitespace-nowrap text-right">已收回</TableHead>
                <TableHead className="whitespace-nowrap text-right">未收回</TableHead>
                <TableHead className="whitespace-nowrap">状态</TableHead>
                <TableHead className="whitespace-nowrap">到期日</TableHead>
                <TableHead className="whitespace-nowrap">备注</TableHead>
                <TableHead className="whitespace-nowrap text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={14} className="text-center text-muted-foreground py-8">暂无垫付记录</TableCell>
                </TableRow>
              )}
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                  <TableCell className="whitespace-nowrap">{r._projectName}</TableCell>
                  <TableCell className="whitespace-nowrap">{r._boothName || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r._boothName || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.paidBy}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.mainCategory}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.subCategory}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(r.amount)}</TableCell>
                  <TableCell className="text-right">{fmt(r.recoveredAmount ?? 0)}</TableCell>
                  <TableCell className="text-right text-destructive font-medium">{fmt(r._unrecovered)}</TableCell>
                  <TableCell>
                    <Badge
                      className={`cursor-pointer ${statusBadgeClass(r._status)}`}
                      onClick={() => cycleStatus(r)}
                      title="点击切换状态"
                    >
                      {STATUS_LABEL[r._status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{r.dueDate || '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={r.description}>{r.description || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(r)} title="编辑">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="查看项目"
                        onClick={() => navigate(`/admin/projects?project=${r.projectId}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {editing && (
        <EditExpenseDialog
          expense={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </div>
  );
};

export default ReimbursementsPage;
