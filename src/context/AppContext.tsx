import React, { createContext, useContext, useState } from 'react';
import { Project, User, Expense, WorkLog, UserRole, Booth, PartnerShare } from '@/types';
import { mockProjects, currentUser, employees as initialEmployees } from '@/data/mockData';

interface AppContextType {
  user: User;
  setUserRole: (role: UserRole) => void;
  projects: Project[];
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (projectId: string, expenseId: string) => void;
  addWorkLog: (workLog: WorkLog) => void;
  updateWorkLog: (workLog: WorkLog) => void;
  deleteWorkLog: (projectId: string, workLogId: string) => void;
  employees: User[];
  addEmployee: (employee: User) => void;
  updateEmployee: (employee: User) => void;
  deleteEmployee: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addBooth: (projectId: string, booth: Booth) => void;
  updateBooth: (projectId: string, booth: Booth) => void;
  deleteBooth: (projectId: string, boothId: string) => void;
  updatePartners: (projectId: string, partners: PartnerShare[]) => void;
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
  const [employeeList, setEmployeeList] = useState<User[]>(initialEmployees);

  const setUserRole = (role: UserRole) => {
    if (role === 'boss') {
      setUser(currentUser);
    } else {
      setUser({ ...employeeList[0], role: 'employee' });
    }
  };

  const addEmployee = (emp: User) => setEmployeeList(prev => [...prev, emp]);
  const updateEmployee = (emp: User) => setEmployeeList(prev => prev.map(e => e.id === emp.id ? emp : e));
  const deleteEmployee = (id: string) => setEmployeeList(prev => prev.filter(e => e.id !== id));

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

  const updateWorkLog = (workLog: WorkLog) => {
    setProjects(prev => prev.map(p =>
      p.id === workLog.projectId
        ? { ...p, workLogs: p.workLogs.map(w => w.id === workLog.id ? workLog : w) }
        : p
    ));
  };

  const deleteWorkLog = (projectId: string, workLogId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, workLogs: p.workLogs.filter(w => w.id !== workLogId) }
        : p
    ));
  };

  const addProject = (project: Project) => setProjects(prev => [...prev, project]);
  const updateProject = (project: Project) => setProjects(prev => prev.map(p => p.id === project.id ? project : p));
  const deleteProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));

  const addBooth = (projectId: string, booth: Booth) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, booths: [...p.booths, booth] } : p
    ));
  };

  const updateBooth = (projectId: string, booth: Booth) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, booths: p.booths.map(b => b.id === booth.id ? booth : b) } : p
    ));
  };

  const deleteBooth = (projectId: string, boothId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, booths: p.booths.filter(b => b.id !== boothId) } : p
    ));
  };

  const updatePartners = (projectId: string, partners: PartnerShare[]) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, partners } : p
    ));
  };

  return (
    <AppContext.Provider value={{
      user, setUserRole, projects,
      addExpense, updateExpense, deleteExpense,
      addWorkLog, updateWorkLog, deleteWorkLog,
      employees: employeeList, addEmployee, updateEmployee, deleteEmployee,
      addProject, updateProject, deleteProject,
      addBooth, updateBooth, deleteBooth,
      updatePartners,
    }}>
      {children}
    </AppContext.Provider>
  );
};
