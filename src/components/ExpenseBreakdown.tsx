import { Expense, ExpenseMainCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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

  const toggle = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // Group by main category
  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const key = e.mainCategory;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  // Group by paidBy
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

          // Sub-group
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
                    <div key={sub} className="flex items-center justify-between rounded-md px-4 py-2 text-sm bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{sub}</span>
                        {data.items.length > 1 && (
                          <span className="text-xs text-muted-foreground/60">({data.items.length}笔)</span>
                        )}
                      </div>
                      <span className="font-medium">${data.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExpenseBreakdown;
