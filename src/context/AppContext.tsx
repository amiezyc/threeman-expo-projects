import React, { createContext, useContext, useState } from 'react';
import { Project, User, Expense, WorkLog, UserRole } from '@/types';
import { mockProjects, currentUser, employees as initialEmployees } from '@/data/mockData';

interface AppContextType {
  user: User;
  setUserRole: (role: UserRole) => void;
  projects: Project[];
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (projectId: string, expenseId: string) => void;
  addWorkLog: (workLog: WorkLog) => void;
  employees: User[];
  addEmployee: (employee: User) => void;
  updateEmployee: (employee: User) => void;
  deleteEmployee: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(currentUser);
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  const setUserRole = (role: UserRole) => {
    if (role === 'boss') {
      setUser(currentUser);
    } else {
      setUser({ ...employees[0], role: 'employee' });
    }
  };

  const addExpense = (expense: Expense) => {
    setProjects(prev => prev.map(p =>
      p.id === expense.projectId
        ? { ...p, expenses: [...p.expenses, expense] }
        : p
    ));
  };

  const updateExpense = (expense: Expense) => {
    setProjects(prev => prev.map(p =>
      p.id === expense.projectId
        ? { ...p, expenses: p.expenses.map(e => e.id === expense.id ? expense : e) }
        : p
    ));
  };

  const deleteExpense = (projectId: string, expenseId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, expenses: p.expenses.filter(e => e.id !== expenseId) }
        : p
    ));
  };

  const addWorkLog = (workLog: WorkLog) => {
    setProjects(prev => prev.map(p =>
      p.id === workLog.projectId
        ? { ...p, workLogs: [...p.workLogs, workLog] }
        : p
    ));
  };

  return (
    <AppContext.Provider value={{ user, setUserRole, projects, addExpense, updateExpense, deleteExpense, addWorkLog, employees }}>
      {children}
    </AppContext.Provider>
  );
};
