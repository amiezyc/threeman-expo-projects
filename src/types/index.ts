export type UserRole = 'boss' | 'employee';

export type RateType = 'daily' | 'hourly';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  dailyRate?: number;
  hourlyRate?: number;
}

export type ExpenseMainCategory = '差旅' | '物料' | '人工' | '三方' | '其他';

export type ExpenseSubCategory =
  | 'Airbnb' | 'Flight' | 'Hotel' | 'Uber' | 'Gas' | 'Parking' | '餐補' | '租車' | 'Walmart'
  | 'Amazon' | '其他物料' | '画面' | '铝合金备料' | '地毯' | '桌椅' | '电视'
  | '吊顶' | '劳工' | '木柜过磅' | '型材物料过磅' | '布/吊顶过磅' | '电费' | '其他三方'
  | '日薪' | '人工搭建' | '撤展'
  | '其他';

export const categoryStructure: Record<ExpenseMainCategory, ExpenseSubCategory[]> = {
  '差旅': ['Airbnb', 'Flight', 'Hotel', 'Uber', 'Gas', 'Parking', '餐補', '租車', 'Walmart'],
  '物料': ['Amazon', '画面', '铝合金备料', '地毯', '桌椅', '电视', '其他物料'],
  '人工': ['日薪', '人工搭建', '撤展'],
  '三方': ['吊顶', '劳工', '木柜过磅', '型材物料过磅', '布/吊顶过磅', '电费', '其他三方'],
  '其他': ['其他'],
};

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
}

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
