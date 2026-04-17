export type UserRole = 'boss' | 'employee';

export type RateType = 'daily' | 'hourly';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  dailyRate?: number;
  hourlyRate?: number;
}

export type ExpenseMainCategory = '差旅' | '物料' | '人工' | '三方' | '电费' | '其他';

export type ExpenseSubCategory =
  | 'Airbnb' | 'Flight' | 'Hotel' | 'Uber' | 'Gas' | 'Parking' | '餐補' | '租車' | 'Walmart'
  | 'Amazon' | '其他物料' | '画面' | '铝合金备料' | '地毯' | '桌椅' | '电视'
  | '吊顶' | '劳工' | '木柜过磅' | '型材物料过磅' | '布/吊顶过磅' | '其他三方' | '过磅'
  | '日薪' | '人工搭建' | '撤展'
  | '电费' | '其他电费'
  | '其他'
  | string;

export const categoryStructure: Record<ExpenseMainCategory, ExpenseSubCategory[]> = {
  '差旅': ['Airbnb', 'Flight', 'Hotel', 'Uber', 'Gas', 'Parking', '餐補', '租車', 'Walmart'],
  '物料': ['Amazon', '画面', '铝合金备料', '地毯', '桌椅', '电视', '其他物料'],
  '人工': ['日薪', '人工搭建', '撤展'],
  '三方': ['吊顶', '劳工', '木柜过磅', '型材物料过磅', '布/吊顶过磅', '其他三方'],
  '电费': ['电费', '其他电费'],
  '其他': ['其他'],
};

export type ReimburseStatus = 'not_billed' | 'billed' | 'partial_recovered' | 'recovered';

export interface Expense {
  id: string;
  projectId: string;
  boothId?: string;
  paidBy: string;
  mainCategory: ExpenseMainCategory;
  subCategory: ExpenseSubCategory;
  amount: number;
  description: string;
  date: string;
  receiptUrl?: string;
  reimbursed?: boolean;
  reimburseStatus?: ReimburseStatus;
  recoveredAmount?: number;
  vendorName?: string;
  clientId?: string;
  dueDate?: string;
  paidDate?: string;
  isClientCost?: boolean;
  unitPrice?: number;
  weight?: number;
}

export type PayrollPaymentStatus = 'unpaid' | 'partial_paid' | 'paid';

export interface WorkLog {
  id: string;
  projectId: string;
  boothId?: string;
  userId: string;
  userName: string;
  date: string;
  dailyRate: number;
  rateType: RateType;
  hours?: number;
  paymentStatus?: PayrollPaymentStatus;
  paidAmount?: number;
  paidDate?: string;
  paidByUserId?: string;
}

export type PaymentStatus = 'pending' | 'invoiced' | 'partial' | 'received' | 'overdue';
export type PaymentType = 'deposit' | 'balance' | 'extra' | 'reimburse_charge';

export interface Payment {
  id: string;
  boothId: string;
  type: PaymentType;
  amount: number;
  receivedAmount?: number;
  status: PaymentStatus;
  invoiceDate?: string;
  receivedDate?: string;
  dueDate?: string;
  invoiceNumber?: string;
  followUpNotes?: string;
  notes?: string;
  documentUrl?: string;
}

export interface Booth {
  id: string;
  projectId: string;
  clientName: string;
  totalContract: number;
  payments: Payment[];
  contractUrl?: string;
}


export interface PartnerShare {
  name: string;
  percentage: number; // 0-100
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  booths: Booth[];
  expenses: Expense[];
  workLogs: WorkLog[];
  partners?: PartnerShare[];
}
