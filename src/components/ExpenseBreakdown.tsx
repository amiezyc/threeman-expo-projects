import { Expense, ExpenseMainCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Pencil, Image, CircleDollarSign } from 'lucide-react';
import { useState } from 'react';
import EditExpenseDialog from './EditExpenseDialog';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

interface ExpenseBreakdownProps {
  expenses: Expense[];
  title?: string;
}

const mainCategoryColors: Record<ExpenseMainCategory, string> = {
  '差旅': 'bg-primary/10 text-primary border-primary/20',
  '物料': 'bg-accent/10 text-accent border-accent/20',
  '人工': 'bg-warning/10 text-warning border-warning/20',
  '三方': 'bg-destructive/10 text-destructive border-destructive/20',
  '电费': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  '其他': 'bg-muted text-muted-foreground',
};

const ExpenseBreakdown = ({ expenses, title }: ExpenseBreakdownProps) => {
  const { updateExpense } = useApp();
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const toggle = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleReimbursed = (e: React.MouseEvent, item: Expense) => {
    e.stopPropagation();
    updateExpense({ ...item, reimbursed: !item.reimbursed });
  };

  const catDisplayName = (cat: ExpenseMainCategory) => {
    const key = `cat.${cat}` as any;
    return t(key);
  };

  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const key = e.mainCategory;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const byPayer = expenses.reduce<Record<string, { total: number; unreimbursed: number }>>((acc, e) => {
    if (!acc[e.paidBy]) acc[e.paidBy] = { total: 0, unreimbursed: 0 };
    acc[e.paidBy].total += e.amount;
    if (!e.reimbursed) acc[e.paidBy].unreimbursed += e.amount;
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

      {Object.keys(byPayer).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(byPayer).map(([name, info]) => (
            <span key={name} className="rounded-full bg-muted px-3 py-1">
              {name}: <span className="font-semibold">${info.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              {info.unreimbursed > 0 && info.unreimbursed < info.total && (
                <span className="text-destructive ml-1">({t('expenses.pendingReimburse')} ${info.unreimbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
              )}
              {info.unreimbursed === info.total && (
                <span className="text-destructive ml-1">({t('expenses.unreimbursedFull')})</span>
              )}
              {info.unreimbursed === 0 && (
                <span className="text-primary ml-1">({t('expenses.reimbursedFull')})</span>
              )}
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
                  <Badge variant="outline" className={mainCategoryColors[cat]}>{catDisplayName(cat)}</Badge>
                </div>
                <span className="font-semibold">${catTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </button>

              {expanded && (
                <div className="ml-7 space-y-0.5 pb-2">
                  {Object.entries(subGrouped).map(([sub, data]) => (
                    <div key={sub} className="space-y-0.5">
                      {data.items.length > 1 && (
                        <div className="flex items-center justify-between rounded-md px-4 py-1.5 text-xs text-muted-foreground">
                          <span>{sub} ({data.items.length}{t('expenses.items')})</span>
                          <span className="font-medium">${data.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {data.items.map(item => (
                        <div
                          key={item.id}
                          className="flex w-full items-center justify-between rounded-md px-4 py-2 text-sm bg-muted/30 hover:bg-muted/60 transition-colors group"
                        >
                          <button
                            onClick={() => setEditingExpense(item)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <span className="text-muted-foreground">{data.items.length === 1 ? sub : ''}</span>
                            <span className="text-xs text-muted-foreground/80">{item.description}</span>
                            {item.receiptUrl && <Image className="h-3 w-3 text-primary" />}
                          </button>
                          <div className="flex items-center gap-2">
                            {item.isClientCost && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {t('expenses.clientCost')}
                              </span>
                            )}
                            <button
                              onClick={(e) => toggleReimbursed(e, item)}
                              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                                item.reimbursed
                                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                  : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                              }`}
                              title={item.reimbursed ? t('expenses.reimbursedTip') : t('expenses.unreimbursedTip')}
                            >
                              <CircleDollarSign className="h-3 w-3" />
                              {item.reimbursed ? t('expenses.reimbursed') : t('expenses.unreimbursed')}
                            </button>
                            <span className="font-medium">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
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
