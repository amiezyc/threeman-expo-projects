import { Expense } from '@/types';

const AUTO_LABOR_SUFFIX = ' 人工费';

export const isAutoLaborExpense = (expense: Expense) => (
  expense.mainCategory === '人工' && expense.subCategory.startsWith('auto:')
);

export const getCanonicalProjectExpenses = (expenses: Expense[]) => (
  expenses.filter((expense) => expense.mainCategory !== '人工' || isAutoLaborExpense(expense))
);

export const getAutoLaborDisplayName = (expense: Expense) => {
  if (!isAutoLaborExpense(expense)) return expense.subCategory;

  const descriptionName = expense.description.replace(/ 人工费$/, '').trim();
  return descriptionName || '未分配员工';
};

export const getEmployeeAutoLaborTotal = (expenses: Expense[], employeeName: string) => (
  expenses
    .filter(isAutoLaborExpense)
    .filter((expense) => getAutoLaborDisplayName(expense) === employeeName)
    .reduce((sum, expense) => sum + expense.amount, 0)
);