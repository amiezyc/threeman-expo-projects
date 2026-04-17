import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import StatCard from '@/components/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, Clock, Briefcase, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { Project } from '@/types';

type ProjectStatus = 'active' | 'completed' | 'settled';
type FilterType = 'all' | 'active' | 'completed' | 'high_risk' | 'unreimbursed';

const getProjectStatus = (project: Project): ProjectStatus => {
  const allPayments = project.booths.flatMap(b => b.payments);
  const allReceived = allPayments.length > 0 && allPayments.every(p => p.status === 'received');
  if (allReceived && allPayments.length > 0) return 'settled';
  if (project.endDate && new Date(project.endDate) < new Date()) return 'completed';
  return 'active';
};

const Dashboard = () => {
  const { projects } = useApp();
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState<FilterType>('all');

  const projectStats = useMemo(() => projects.map(project => {
    const totalContract = project.booths.reduce((s, b) => s + b.totalContract, 0);
    const totalExpenses = project.expenses.filter(e => !e.isClientCost).reduce((s, e) => s + e.amount, 0);
    const allPayments = project.booths.flatMap(b => b.payments);
    // received now uses received_amount when present
    const received = allPayments.reduce((s, p) => s + (p.receivedAmount ?? (p.status === 'received' ? p.amount : 0)), 0);
    const pending = allPayments.reduce((s, p) => s + Math.max(0, p.amount - (p.receivedAmount ?? (p.status === 'received' ? p.amount : 0))), 0);
    // 应付工资 = unpaid portion of work logs
    const laborPayable = project.workLogs.reduce((s, w) => {
      const amt = w.rateType === 'hourly' ? w.dailyRate * (w.hours || 0) : w.dailyRate;
      const paid = w.paidAmount ?? 0;
      return s + Math.max(0, amt - paid);
    }, 0);
    const laborExpenses = project.expenses.filter(e => e.mainCategory === '人工' && !e.isClientCost).reduce((s, e) => s + e.amount, 0);
    // 未收回垫付 = expenses with reimburse status not recovered, count remaining
    const advancedExpenses = project.expenses
      .filter(e => !e.isClientCost && e.paidBy !== 'System')
      .reduce((s, e) => {
        const isReimbursable = e.reimburseStatus ? e.reimburseStatus !== 'recovered' : !e.reimbursed;
        if (!isReimbursable) return s;
        const recovered = e.recoveredAmount ?? 0;
        return s + Math.max(0, e.amount - recovered);
      }, 0);
    const profit = totalContract - totalExpenses;
    const profitRate = totalContract > 0 ? (profit / totalContract) * 100 : 0;
    const status = getProjectStatus(project);
    const boothCount = project.booths.length;
    const clients = project.booths.map(b => b.clientName).join(', ');
    const isHighRisk = profitRate < 10 || pending > totalContract * 0.5;

    return {
      project, totalContract, totalExpenses, received, pending,
      laborExpenses, laborPayable, advancedExpenses, profit, profitRate, status,
      boothCount, clients, isHighRisk,
    };
  }), [projects]);

  // Summary
  const activeCount = projectStats.filter(p => p.status === 'active').length;
  const completedCount = projectStats.filter(p => p.status !== 'active').length;
  const monthlyReceived = projectStats.reduce((s, p) => s + p.received, 0);
  const monthlyExpenses = projectStats.reduce((s, p) => s + p.totalExpenses, 0);
  const totalUnreimbursed = projectStats.reduce((s, p) => s + p.advancedExpenses, 0);
  const totalPending = projectStats.reduce((s, p) => s + p.pending, 0);
  const totalLabor = projectStats.reduce((s, p) => s + p.laborExpenses, 0);
  const totalProfit = projectStats.reduce((s, p) => s + p.profit, 0);

  const filtered = projectStats.filter(p => {
    if (filter === 'active') return p.status === 'active';
    if (filter === 'completed') return p.status !== 'active';
    if (filter === 'high_risk') return p.isHighRisk;
    if (filter === 'unreimbursed') return p.advancedExpenses > 0;
    return true;
  });

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmt2 = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statusLabel = (s: ProjectStatus) => {
    const map = { active: lang === 'zh' ? '进行中' : 'Active', completed: lang === 'zh' ? '已完成' : 'Completed', settled: lang === 'zh' ? '已结算' : 'Settled' };
    return map[s];
  };
  const statusVariant = (s: ProjectStatus) => {
    if (s === 'active') return 'default' as const;
    if (s === 'settled') return 'secondary' as const;
    return 'outline' as const;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('dashboard.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('dashboard.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title={lang === 'zh' ? '进行中项目' : 'Active Projects'} value={String(activeCount)} icon={Briefcase} />
        <StatCard title={lang === 'zh' ? '已完成项目' : 'Completed'} value={String(completedCount)} icon={CheckCircle} variant="success" />
        <StatCard title={lang === 'zh' ? '总收款' : 'Total Received'} value={fmt(monthlyReceived)} icon={DollarSign} />
        <StatCard title={lang === 'zh' ? '总支出' : 'Total Expenses'} value={fmt(monthlyExpenses)} icon={TrendingDown} variant="warning" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title={lang === 'zh' ? '未收回垫付' : 'Unreimbursed'} value={fmt2(totalUnreimbursed)} icon={AlertTriangle} variant={totalUnreimbursed > 0 ? 'destructive' : 'default'} />
        <StatCard title={lang === 'zh' ? '待收款' : 'Pending Payments'} value={fmt(totalPending)} icon={Clock} variant="warning" />
        <StatCard title={lang === 'zh' ? '应付工资' : 'Labor Payable'} value={fmt2(totalLabor)} icon={Users} />
        <StatCard title={lang === 'zh' ? '预计总利润' : 'Est. Total Profit'} value={fmt2(totalProfit)} icon={TrendingUp} variant={totalProfit > 0 ? 'success' : 'destructive'} />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{lang === 'zh' ? '筛选' : 'Filter'}:</span>
        <Select value={filter} onValueChange={v => setFilter(v as FilterType)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'zh' ? '全部' : 'All'}</SelectItem>
            <SelectItem value="active">{lang === 'zh' ? '仅进行中' : 'Active Only'}</SelectItem>
            <SelectItem value="completed">{lang === 'zh' ? '仅已完成' : 'Completed Only'}</SelectItem>
            <SelectItem value="high_risk">{lang === 'zh' ? '高风险项目' : 'High Risk'}</SelectItem>
            <SelectItem value="unreimbursed">{lang === 'zh' ? '垫付未回' : 'Unreimbursed'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Table */}
      <div className="glass-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang === 'zh' ? '项目' : 'Project'}</TableHead>
              <TableHead>{lang === 'zh' ? '客户' : 'Clients'}</TableHead>
              <TableHead className="text-center">Booths</TableHead>
              <TableHead>{lang === 'zh' ? '状态' : 'Status'}</TableHead>
              <TableHead className="text-right">{lang === 'zh' ? '已收款' : 'Received'}</TableHead>
              <TableHead className="text-right">{lang === 'zh' ? '待收款' : 'Pending'}</TableHead>
              <TableHead className="text-right">{lang === 'zh' ? '已支出' : 'Spent'}</TableHead>
              <TableHead className="text-right">{lang === 'zh' ? '未收回垫付' : 'Unreimb.'}</TableHead>
              <TableHead className="text-right">{lang === 'zh' ? '应付工资' : 'Labor'}</TableHead>
              <TableHead className="text-right">{lang === 'zh' ? '利润' : 'Profit'}</TableHead>
              <TableHead className="text-right">{lang === 'zh' ? '利润率' : 'Margin'}</TableHead>
              <TableHead className="text-center">{lang === 'zh' ? '风险' : 'Risk'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(row => (
              <TableRow key={row.project.id}>
                <TableCell className="font-medium">{row.project.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">{row.clients || '-'}</TableCell>
                <TableCell className="text-center">{row.boothCount}</TableCell>
                <TableCell><Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge></TableCell>
                <TableCell className="text-right">{fmt(row.received)}</TableCell>
                <TableCell className="text-right">{fmt(row.pending)}</TableCell>
                <TableCell className="text-right">{fmt2(row.totalExpenses)}</TableCell>
                <TableCell className="text-right">{row.advancedExpenses > 0 ? fmt2(row.advancedExpenses) : '-'}</TableCell>
                <TableCell className="text-right">{fmt2(row.laborExpenses)}</TableCell>
                <TableCell className={`text-right font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt2(row.profit)}</TableCell>
                <TableCell className="text-right">{row.profitRate.toFixed(1)}%</TableCell>
                <TableCell className="text-center">
                  {row.isHighRisk && <AlertTriangle className="h-4 w-4 text-orange-500 mx-auto" />}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                  {lang === 'zh' ? '暂无数据' : 'No data'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Dashboard;
