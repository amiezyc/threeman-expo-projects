import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Expense, WorkLog, Booth, PartnerShare, Payment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  role: string;
  dailyRate?: number;
  hourlyRate?: number;
}

interface AppContextType {
  projects: Project[];
  loading: boolean;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (projectId: string, expenseId: string) => void;
  addWorkLog: (workLog: WorkLog) => void;
  updateWorkLog: (workLog: WorkLog) => void;
  deleteWorkLog: (projectId: string, workLogId: string) => void;
  employees: Employee[];
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

const noop = () => {};
const asyncNoop = async () => {};

const defaultAppContext: AppContextType = {
  projects: [],
  loading: true,
  addExpense: asyncNoop,
  updateExpense: asyncNoop,
  deleteExpense: asyncNoop,
  addWorkLog: asyncNoop,
  updateWorkLog: asyncNoop,
  deleteWorkLog: asyncNoop,
  employees: [],
  addProject: asyncNoop,
  updateProject: asyncNoop,
  deleteProject: asyncNoop,
  addBooth: asyncNoop,
  updateBooth: asyncNoop,
  deleteBooth: asyncNoop,
  updatePartners: asyncNoop,
  addPayment: asyncNoop,
  updatePayment: asyncNoop,
  deletePayment: asyncNoop,
};

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  return ctx ?? defaultAppContext;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const syncingRef = React.useRef<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      const [projRes, boothRes, payRes, expRes, wlRes, profilesRes, partnerRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('booths').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('work_logs').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('partner_shares').select('*'),
      ]);

      const projectRows = projRes.data || [];
      const boothRows = boothRes.data || [];
      const paymentRows = payRes.data || [];
      const expenseRows = expRes.data || [];
      const workLogRows = wlRes.data || [];
      const profileRows = profilesRes.data || [];
      const partnerRows = partnerRes.data || [];

      const mappedProjects: Project[] = projectRows.map((p: any) => {
        const booths: Booth[] = boothRows
          .filter((b: any) => b.project_id === p.id)
          .map((b: any) => ({
            id: b.id,
            projectId: b.project_id,
            clientName: b.client_name,
            totalContract: Number(b.total_contract),
            contractUrl: b.contract_url || undefined,
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
                documentUrl: pay.document_url || undefined,
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
            reimbursed: !!e.reimbursed,
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

      // Use profiles as employees list
      setEmployees(profileRows.map((e: any) => ({
        id: e.id,
        name: e.name,
        role: e.role,
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
      client_name: booth.clientName, total_contract: booth.totalContract, contract_url: booth.contractUrl || null,
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
      reimbursed: expense.reimbursed ?? false,
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

  // === Sync labor expenses (idempotent via source_id + UPSERT) ===
  const syncLaborExpenses = async (project: Project): Promise<Project> => {
    if (syncingRef.current[project.id]) return project;
    syncingRef.current[project.id] = true;
    try {
      // Aggregate work logs by employee
      const byEmployee = new Map<string, { userName: string; total: number }>();
      project.workLogs.forEach(w => {
        const existing = byEmployee.get(w.userId) || { userName: w.userName, total: 0 };
        const pay = w.rateType === 'hourly' ? w.dailyRate * (w.hours || 0) : w.dailyRate;
        existing.total += pay;
        byEmployee.set(w.userId, existing);
      });

      // Fetch existing auto-labor expenses by source_id
      const { data: dbAuto } = await supabase.from('expenses').select('*')
        .eq('project_id', project.id).eq('main_category', '人工').not('source_id', 'is', null);
      const existingBySource = new Map((dbAuto || []).map((e: any) => [e.source_id, e]));

      const upsertResults: Expense[] = [];
      for (const [userId, info] of byEmployee) {
        if (info.total <= 0) continue;
        const subCat = `auto:${userId}`;
        const existing = existingBySource.get(userId);

        if (existing) {
          // Update if amount changed
          if (Number(existing.amount) !== info.total) {
            await supabase.from('expenses').update({ amount: info.total, description: `${info.userName} 人工费` }).eq('id', existing.id);
          }
          upsertResults.push({
            id: existing.id, projectId: project.id, paidBy: 'System',
            mainCategory: '人工' as any, subCategory: subCat as any,
            amount: info.total, description: `${info.userName} 人工费`, date: existing.date,
          });
          existingBySource.delete(userId); // mark as handled
        } else {
          const { data, error } = await supabase.from('expenses').insert({
            project_id: project.id, booth_id: null, paid_by: 'System',
            main_category: '人工', sub_category: subCat, source_id: userId,
            amount: info.total, description: `${info.userName} 人工费`,
            date: new Date().toISOString().split('T')[0],
          }).select().single();
          if (!error && data) {
            upsertResults.push({
              id: data.id, projectId: project.id, paidBy: 'System',
              mainCategory: '人工' as any, subCategory: subCat as any,
              amount: info.total, description: data.description, date: data.date,
            });
          } else if (error?.code === '23505') {
            // Conflict: re-fetch and update
            const { data: r } = await supabase.from('expenses').select('*')
              .eq('project_id', project.id).eq('source_id', userId).single();
            if (r) {
              await supabase.from('expenses').update({ amount: info.total }).eq('id', r.id);
              upsertResults.push({
                id: r.id, projectId: project.id, paidBy: 'System',
                mainCategory: '人工' as any, subCategory: subCat as any,
                amount: info.total, description: r.description, date: r.date,
              });
            }
          }
        }
      }

      // Delete stale auto-expenses (remaining in existingBySource = no longer in work logs)
      for (const [, staleRow] of existingBySource) {
        await supabase.from('expenses').delete().eq('id', staleRow.id);
      }

      // Rebuild local expenses: keep non-auto, replace auto with fresh upsert results
      const nonAutoExpenses = project.expenses.filter(
        e => !(e.mainCategory === '人工' && e.subCategory.startsWith('auto:'))
      );
      return { ...project, expenses: [...nonAutoExpenses, ...upsertResults] };
    } finally {
      syncingRef.current[project.id] = false;
    }
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
      rate_type: workLog.rateType || 'daily',
      hours: workLog.hours || null,
    }).select().single();
    if (error) { toast.error('保存失败'); return; }
    const newLog = { ...workLog, id: data.id };
    let project = projects.find(p => p.id === workLog.projectId);
    if (!project) return;
    project = { ...project, workLogs: [...project.workLogs, newLog] };
    const synced = await syncLaborExpenses(project);
    setProjects(prev => prev.map(p => p.id === synced.id ? synced : p));
  };

  const updateWorkLog = async (workLog: WorkLog) => {
    await supabase.from('work_logs').update({
      project_id: workLog.projectId,
      booth_id: workLog.boothId || null,
      date: workLog.date,
      daily_rate: workLog.dailyRate,
      rate_type: workLog.rateType || 'daily',
      hours: workLog.hours || null,
    }).eq('id', workLog.id);
    let project = projects.find(p => p.id === workLog.projectId);
    if (!project) return;
    project = { ...project, workLogs: project.workLogs.map(w => w.id === workLog.id ? workLog : w) };
    const synced = await syncLaborExpenses(project);
    setProjects(prev => prev.map(p => p.id === synced.id ? synced : p));
  };

  const deleteWorkLog = async (projectId: string, workLogId: string) => {
    await supabase.from('work_logs').delete().eq('id', workLogId);
    let project = projects.find(p => p.id === projectId);
    if (!project) return;
    project = { ...project, workLogs: project.workLogs.filter(w => w.id !== workLogId) };
    const synced = await syncLaborExpenses(project);
    setProjects(prev => prev.map(p => p.id === synced.id ? synced : p));
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
      document_url: payment.documentUrl || null,
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
      document_url: payment.documentUrl || null,
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
      projects, loading,
      addExpense, updateExpense, deleteExpense,
      addWorkLog, updateWorkLog, deleteWorkLog,
      employees,
      addProject, updateProject, deleteProject,
      addBooth, updateBooth, deleteBooth,
      updatePartners,
      addPayment, updatePayment, deletePayment,
    }}>
      {children}
    </AppContext.Provider>
  );
};
