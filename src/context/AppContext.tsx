import React, { createContext, useContext, useState } from 'react';
import { Project, User, Expense, WorkLog, UserRole } from '@/types';
import { mockProjects, currentUser, employees } from '@/data/mockData';

interface AppContextType {
  user: User;
  setUserRole: (role: UserRole) => void;
  projects: Project[];
  addExpense: (expense: Expense) => void;
  addWorkLog: (workLog: WorkLog) => void;
  employees: User[];
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

  const addWorkLog = (workLog: WorkLog) => {
    setProjects(prev => prev.map(p =>
      p.id === workLog.projectId
        ? { ...p, workLogs: [...p.workLogs, workLog] }
        : p
    ));
  };

  return (
    <AppContext.Provider value={{ user, setUserRole, projects, addExpense, addWorkLog, employees }}>
      {children}
    </AppContext.Provider>
  );
};
