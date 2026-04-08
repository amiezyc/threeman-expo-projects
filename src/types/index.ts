export type UserRole = 'boss' | 'employee';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  dailyRate?: number;
}

export type ExpenseCategory = 
  | '材料费' | '运输费' | '人工费' | '设计费' 
  | '印刷费' | '设备租赁' | '餐饮住宿' | '其他';

export interface Expense {
  id: string;
  projectId: string;
  boothId: string;
  userId: string;
  userName: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  receiptUrl?: string;
}

export interface WorkLog {
  id: string;
  projectId: string;
  boothId: string;
  userId: string;
  userName: string;
  date: string;
  dailyRate: number;
}

export type PaymentStatus = 'pending' | 'invoiced' | 'received';

export interface Payment {
  id: string;
  boothId: string;
  type: 'deposit' | 'balance';
  amount: number;
  status: PaymentStatus;
  invoiceDate?: string;
  receivedDate?: string;
  notes?: string;
}

export interface Booth {
  id: string;
  projectId: string;
  clientName: string;
  totalContract: number;
  payments: Payment[];
  expenses: Expense[];
  workLogs: WorkLog[];
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  booths: Booth[];
}
