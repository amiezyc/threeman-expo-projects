import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import ExpenseBreakdown from '@/components/ExpenseBreakdown';
import AddExpenseDialog from '@/components/AddExpenseDialog';

const EmployeeExpenses = () => {
  const { profile } = useAuth();
  const { projects } = useApp();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('expenses.myExpenses')}</h2>
        <p className="text-muted-foreground text-sm">{t('expenses.myExpensesSubtitle')}</p>
      </div>

      {projects.map(project => {
        const myExpenses = project.expenses.filter(e => e.paidBy === profile?.name);
        const myTotal = myExpenses.reduce((s, e) => s + e.amount, 0);

        return (
          <div key={project.id} className="space-y-4">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <div className="glass-card rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{t('expenses.myExpensesTotal')} ${myTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                <AddExpenseDialog projectId={project.id} />
              </div>
              {myExpenses.length > 0 ? (
                <ExpenseBreakdown expenses={myExpenses} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('expenses.noExpenses')}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeExpenses;
