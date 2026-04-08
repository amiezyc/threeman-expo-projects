import { Expense } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ExpenseTableProps {
  expenses: Expense[];
  showUser?: boolean;
}

const categoryColors: Record<string, string> = {
  '材料费': 'bg-primary/10 text-primary border-primary/20',
  '运输费': 'bg-accent/10 text-accent border-accent/20',
  '人工费': 'bg-warning/10 text-warning border-warning/20',
  '设计费': 'bg-success/10 text-success border-success/20',
  '印刷费': 'bg-destructive/10 text-destructive border-destructive/20',
  '设备租赁': 'bg-muted text-muted-foreground',
  '餐饮住宿': 'bg-secondary text-secondary-foreground',
  '其他': 'bg-muted text-muted-foreground',
};

const ExpenseTable = ({ expenses, showUser = true }: ExpenseTableProps) => (
  <div className="rounded-lg border border-border/50 overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>日期</TableHead>
          {showUser && <TableHead>提交人</TableHead>}
          <TableHead>类别</TableHead>
          <TableHead>说明</TableHead>
          <TableHead className="text-right">金额</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showUser ? 5 : 4} className="text-center py-8 text-muted-foreground">暂无开销记录</TableCell>
          </TableRow>
        ) : (
          expenses.map(exp => (
            <TableRow key={exp.id} className="hover:bg-muted/30">
              <TableCell className="text-sm">{exp.date}</TableCell>
              {showUser && <TableCell className="text-sm font-medium">{exp.userName}</TableCell>}
              <TableCell>
                <Badge variant="outline" className={categoryColors[exp.category] || ''}>
                  {exp.category}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{exp.description}</TableCell>
              <TableCell className="text-right font-semibold">${exp.amount.toLocaleString()}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

export default ExpenseTable;
