import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, User, Expense, WorkLog, UserRole, Booth, PartnerShare, Payment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppContextType {
  user: User;
  setUserRole: (role: UserRole) => void;
  projects: Project[];
  loading: boolean;
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
  addPayment: (boothId: string, payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (boothId: string, paymentId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

const defaultUser: User = { id: 'boss-1', name: 'Ami', role: 'boss' };

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(defaultUser);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data from DB
  const loadData = useCallback(async () => {
    try {
      const [projRes, boothRes, payRes, expRes, wlRes, empRes, partnerRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('booths').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('work_logs').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('partner_shares').select('*'),
      ]);

      const projectRows = projRes.data || [];
      const boothRows = boothRes.data || [];
      const paymentRows = payRes.data || [];
      const expenseRows = expRes.data || [];
      const workLogRows = wlRes.data || [];
      const employeeRows = empRes.data || [];
      const partnerRows = partnerRes.data || [];

      const mappedProjects: Project[] = projectRows.map((p: any) => {
        const booths: Booth[] = boothRows
          .filter((b: any) => b.project_id === p.id)
          .map((b: any) => ({
            id: b.id,
            projectId: b.project_id,
            clientName: b.client_name,
            totalContract: Number(b.total_contract),
            payments: paymentRows
              .filter((pay: any) => pay.booth_id === b.id)
              .map((pay: any) => ({
                id: pay.id,
                boothId: pay.booth_id,
                type: pay.type as 'deposit' | 'balance',
                amount: Number(pay.amount),
                status: pay.status as any,
                invoiceDate: pay.invoice_date || undefined,
                receivedDate: pay.received_date || undefined,
                notes: pay.notes || undefined,
              })),
          }));

        const expenses: Expense[] = expenseRows
          .filter((e: any) => e.project_id === p.id)
          .map((e: any) => ({
            id: e.id,
            projectId: e.project_id,
            boothId: e.booth_id || undefined,
            paidBy: e.paid_by,
            mainCategory: e.main_category as any,
            subCategory: e.sub_category as any,
            amount: Number(e.amount),
            description: e.description,
            date: e.date,
            receiptUrl: e.receipt_url || undefined,
          }));

        const workLogs: WorkLog[] = workLogRows
          .filter((w: any) => w.project_id === p.id)
          .map((w: any) => ({
            id: w.id,
            projectId: w.project_id,
            boothId: w.booth_id || undefined,
            userId: w.user_id,
            userName: w.user_name,
            date: w.date,
            dailyRate: Number(w.daily_rate),
            rateType: (w.rate_type || 'daily') as 'daily' | 'hourly',
            hours: w.hours ? Number(w.hours) : undefined,
          }));

        const partners: PartnerShare[] = partnerRows
          .filter((pt: any) => pt.project_id === p.id)
          .map((pt: any) => ({ name: pt.name, percentage: Number(pt.percentage) }));

        return {
          id: p.id,
          name: p.name,
          startDate: p.start_date,
          endDate: p.end_date || undefined,
          booths,
          expenses,
          workLogs,
          partners,
        };
      });

      setProjects(mappedProjects);

      setEmployees(employeeRows.map((e: any) => ({
        id: e.id,
        name: e.name,
        role: e.role as UserRole,
        dailyRate: e.daily_rate ? Number(e.daily_rate) : undefined,
        hourlyRate: e.hourly_rate ? Number(e.hourly_rate) : undefined,
      })));
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const setUserRole = (role: UserRole) => {
    if (role === 'boss') {
      setUser(defaultUser);
    } else {
      setUser(employees.length > 0 ? { ...employees[0], role: 'employee' } : { ...defaultUser, role: 'employee' });
    }
  };

  // === Employees ===
  const addEmployee = async (emp: User) => {
    const { data, error } = await supabase.from('employees').insert({
      name: emp.name, role: emp.role, daily_rate: emp.dailyRate ?? 250, hourly_rate: emp.hourlyRate ?? null,
    }).select().single();
    if (error) { toast.error('保存失败'); return; }
    setEmployees(prev => [...prev, { id: data.id, name: data.name, role: data.role as UserRole, dailyRate: Number(data.daily_rate), hourlyRate: data.hourly_rate ? Number(data.hourly_rate) : undefined }]);
  };

  const updateEmployee = async (emp: User) => {
    const { error } = await supabase.from('employees').update({
      name: emp.name, role: emp.role, daily_rate: emp.dailyRate, hourly_rate: emp.hourlyRate ?? null,
    }).eq('id', emp.id);
    if (error) { toast.error('保存失败'); return; }
    setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
  };

  const deleteEmployee = async (id: string) => {
    await supabase.from('employees').delete().eq('id', id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // === Projects ===
  const addProject = async (project: Project) => {
    const { data, error } = await supabase.from('projects').insert({
      name: project.name, start_date: project.startDate, end_date: project.endDate || null,
    }).select().single();
    if (error) { toast.error('保存失败'); return; }
    setProjects(prev => [{ ...project, id: data.id }, ...prev]);
  };

  const updateProject = async (project: Project) => {
    await supabase.from('projects').update({
      name: project.name, start_date: project.startDate, end_date: project.endDate || null,
    }).eq('id', project.id);
    setProjects(prev => prev.map(p => p.id === project.id ? project : p));
  };

  const deleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // === Booths ===
  const addBooth = async (projectId: string, booth: Booth) => {
    const { data, error } = await supabase.from('booths').insert({
      project_id: projectId, client_name: booth.clientName, total_contract: booth.totalContract,
    }).select().single();
    if (error) { toast.error('保存失败'); return; }
    const newBooth = { ...booth, id: data.id };
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, booths: [...p.booths, newBooth] } : p
    ));
  };

  const updateBooth = async (projectId: string, booth: Booth) => {
    await supabase.from('booths').update({
      client_name: booth.clientName, total_contract: booth.totalContract,
    }).eq('id', booth.id);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, booths: p.booths.map(b => b.id === booth.id ? booth : b) } : p
    ));
  };

  const deleteBooth = async (projectId: string, boothId: string) => {
    await supabase.from('booths').delete().eq('id', boothId);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, booths: p.booths.filter(b => b.id !== boothId) } : p
    ));
  };

  // === Partners ===
  const updatePartners = async (projectId: string, partners: PartnerShare[]) => {
    await supabase.from('partner_shares').delete().eq('project_id', projectId);
    if (partners.length > 0) {
      await supabase.from('partner_shares').insert(
        partners.map(p => ({ project_id: projectId, name: p.name, percentage: p.percentage }))
      );
    }
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, partners } : p
    ));
  };

  // === Expenses ===
  const addExpense = async (expense: Expense) => {
    const { data, error } = await supabase.from('expenses').insert({
      project_id: expense.projectId,
      booth_id: expense.boothId || null,
      paid_by: expense.paidBy,
      main_category: expense.mainCategory,
      sub_category: expense.subCategory,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      receipt_url: expense.receiptUrl || null,
    }).select().single();
    if (error) { toast.error('保存失败'); return; }
    const newExpense = { ...expense, id: data.id };
    setProjects(prev => prev.map(p =>
      p.id === expense.projectId ? { ...p, expenses: [...p.expenses, newExpense] } : p
    ));
  };

  const updateExpense = async (expense: Expense) => {
    await supabase.from('expenses').update({
      booth_id: expense.boothId || null,
      paid_by: expense.paidBy,
      main_category: expense.mainCategory,
      sub_category: expense.subCategory,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      receipt_url: expense.receiptUrl || null,
    }).eq('id', expense.id);
    setProjects(prev => prev.map(p =>
      p.id === expense.projectId ? { ...p, expenses: p.expenses.map(e => e.id === expense.id ? expense : e) } : p
    ));
  };

  const deleteExpense = async (projectId: string, expenseId: string) => {
    await supabase.from('expenses').delete().eq('id', expenseId);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, expenses: p.expenses.filter(e => e.id !== expenseId) } : p
    ));
  };

  // === Sync labor expenses from work logs ===
  const syncLaborExpenses = async (projectId: string, updatedProjects?: Project[]) => {
    const source = updatedProjects || projects;
    const project = source.find(p => p.id === projectId);
    if (!project) return;

    // Group work logs by employee
    const byEmployee = new Map<string, { userName: string; total: number }>();
    project.workLogs.forEach(w => {
      const existing = byEmployee.get(w.userId) || { userName: w.userName, total: 0 };
      existing.total += w.dailyRate;
      byEmployee.set(w.userId, existing);
    });

    // Get existing auto-generated labor expenses (sub_category starts with "auto:")
    const existingLaborExpenses = project.expenses.filter(
      e => e.mainCategory === '人工' && e.subCategory.startsWith('auto:')
    );

    const newExpenses = [...project.expenses.filter(e => !(e.mainCategory === '人工' && e.subCategory.startsWith('auto:')))];

    // Delete old auto labor expenses from DB
    const oldIds = existingLaborExpenses.map(e => e.id);
    if (oldIds.length > 0) {
      await supabase.from('expenses').delete().in('id', oldIds);
    }

    // Insert new auto labor expenses
    for (const [userId, info] of byEmployee) {
      if (info.total <= 0) continue;
      const { data, error } = await supabase.from('expenses').insert({
        project_id: projectId,
        booth_id: null,
        paid_by: 'Ami',
        main_category: '人工',
        sub_category: `auto:${userId}`,
        amount: info.total,
        description: `${info.userName} 人工费`,
        date: new Date().toISOString().split('T')[0],
      }).select().single();
      if (!error && data) {
        newExpenses.push({
          id: data.id,
          projectId,
          paidBy: 'Ami',
          mainCategory: '人工' as any,
          subCategory: `auto:${userId}` as any,
          amount: info.total,
          description: `${info.userName} 人工费`,
          date: new Date().toISOString().split('T')[0],
        });
      }
    }

    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, expenses: newExpenses } : p
    ));
  };

  // === Work Logs ===
  const addWorkLog = async (workLog: WorkLog) => {
    const { data, error } = await supabase.from('work_logs').insert({
      project_id: workLog.projectId,
      booth_id: workLog.boothId || null,
      user_id: workLog.userId,
      user_name: workLog.userName,
      date: workLog.date,
      daily_rate: workLog.dailyRate,
    }).select().single();
    if (error) { toast.error('保存失败'); return; }
    const newLog = { ...workLog, id: data.id };
    const updated = projects.map(p =>
      p.id === workLog.projectId ? { ...p, workLogs: [...p.workLogs, newLog] } : p
    );
    setProjects(updated);
    await syncLaborExpenses(workLog.projectId, updated);
  };

  const updateWorkLog = async (workLog: WorkLog) => {
    await supabase.from('work_logs').update({
      project_id: workLog.projectId,
      booth_id: workLog.boothId || null,
      date: workLog.date,
      daily_rate: workLog.dailyRate,
    }).eq('id', workLog.id);
    const updated = projects.map(p =>
      p.id === workLog.projectId ? { ...p, workLogs: p.workLogs.map(w => w.id === workLog.id ? workLog : w) } : p
    );
    setProjects(updated);
    await syncLaborExpenses(workLog.projectId, updated);
  };

  const deleteWorkLog = async (projectId: string, workLogId: string) => {
    await supabase.from('work_logs').delete().eq('id', workLogId);
    const updated = projects.map(p =>
      p.id === projectId ? { ...p, workLogs: p.workLogs.filter(w => w.id !== workLogId) } : p
    );
    setProjects(updated);
    await syncLaborExpenses(projectId, updated);
  };

  // === Payments ===
  const addPayment = async (boothId: string, payment: Payment) => {
    const { data, error } = await supabase.from('payments').insert({
      booth_id: boothId,
      type: payment.type,
      amount: payment.amount,
      status: payment.status,
      invoice_date: payment.invoiceDate || null,
      received_date: payment.receivedDate || null,
      notes: payment.notes || null,
    }).select().single();
    if (error) { toast.error('保存失败'); return; }
    const newPayment = { ...payment, id: data.id };
    setProjects(prev => prev.map(p => ({
      ...p,
      booths: p.booths.map(b =>
        b.id === boothId ? { ...b, payments: [...b.payments, newPayment] } : b
      ),
    })));
  };

  const updatePayment = async (payment: Payment) => {
    await supabase.from('payments').update({
      type: payment.type,
      amount: payment.amount,
      status: payment.status,
      invoice_date: payment.invoiceDate || null,
      received_date: payment.receivedDate || null,
      notes: payment.notes || null,
    }).eq('id', payment.id);
    setProjects(prev => prev.map(p => ({
      ...p,
      booths: p.booths.map(b =>
        b.id === payment.boothId
          ? { ...b, payments: b.payments.map(pay => pay.id === payment.id ? payment : pay) }
          : b
      ),
    })));
  };

  const deletePayment = async (boothId: string, paymentId: string) => {
    await supabase.from('payments').delete().eq('id', paymentId);
    setProjects(prev => prev.map(p => ({
      ...p,
      booths: p.booths.map(b =>
        b.id === boothId ? { ...b, payments: b.payments.filter(pay => pay.id !== paymentId) } : b
      ),
    })));
  };

  return (
    <AppContext.Provider value={{
      user, setUserRole, projects, loading,
      addExpense, updateExpense, deleteExpense,
      addWorkLog, updateWorkLog, deleteWorkLog,
      employees, addEmployee, updateEmployee, deleteEmployee,
      addProject, updateProject, deleteProject,
      addBooth, updateBooth, deleteBooth,
      updatePartners,
      addPayment, updatePayment, deletePayment,
    }}>
      {children}
    </AppContext.Provider>
  );
};
