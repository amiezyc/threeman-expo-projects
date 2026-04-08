import { Expense, ExpenseMainCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Pencil, Image } from 'lucide-react';
import { useState } from 'react';
import EditExpenseDialog from './EditExpenseDialog';

interface ExpenseBreakdownProps {
  expenses: Expense[];
  title?: string;
}

const mainCategoryColors: Record<ExpenseMainCategory, string> = {
  '差旅': 'bg-primary/10 text-primary border-primary/20',
  '物料': 'bg-accent/10 text-accent border-accent/20',
  '人工': 'bg-warning/10 text-warning border-warning/20',
  '三方': 'bg-destructive/10 text-destructive border-destructive/20',
  '其他': 'bg-muted text-muted-foreground',
};

const ExpenseBreakdown = ({ expenses, title }: ExpenseBreakdownProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const toggle = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const key = e.mainCategory;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const byPayer = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.paidBy] = (acc[e.paidBy] || 0) + e.amount;
    return acc;
  }, {});

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{title}</h4>
          <span className="text-lg font-bold">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      )}

      {Object.keys(byPayer).length > 1 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(byPayer).map(([name, amt]) => (
            <span key={name} className="rounded-full bg-muted px-3 py-1">
              Paid by {name}: <span className="font-semibold">${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1">
        {(Object.entries(grouped) as [ExpenseMainCategory, Expense[]][]).map(([cat, items]) => {
          const catTotal = items.reduce((s, e) => s + e.amount, 0);
          const expanded = expandedCategories.has(cat);

          const subGrouped = items.reduce<Record<string, { total: number; items: Expense[] }>>((acc, e) => {
            if (!acc[e.subCategory]) acc[e.subCategory] = { total: 0, items: [] };
            acc[e.subCategory].total += e.amount;
            acc[e.subCategory].items.push(e);
            return acc;
          }, {});

          return (
            <div key={cat}>
              <button
                onClick={() => toggle(cat)}
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <Badge variant="outline" className={mainCategoryColors[cat]}>{cat}</Badge>
                </div>
                <span className="font-semibold">${catTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </button>

              {expanded && (
                <div className="ml-7 space-y-0.5 pb-2">
                  {Object.entries(subGrouped).map(([sub, data]) => (
                    <div key={sub} className="space-y-0.5">
                      {data.items.length > 1 && (
                        <div className="flex items-center justify-between rounded-md px-4 py-1.5 text-xs text-muted-foreground">
                          <span>{sub} ({data.items.length}笔)</span>
                          <span className="font-medium">${data.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {data.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setEditingExpense(item)}
                          className="flex w-full items-center justify-between rounded-md px-4 py-2 text-sm bg-muted/30 hover:bg-muted/60 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{data.items.length === 1 ? sub : ''}</span>
                            <span className="text-xs text-muted-foreground/80">{item.description}</span>
                            {item.receiptUrl && <Image className="h-3 w-3 text-primary" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
        />
      )}
    </div>
  );
};

export default ExpenseBreakdown;
