import { Project, User } from '@/types';

export const currentUser: User = {
  id: 'boss-1',
  name: 'Ami',
  role: 'boss',
};

export const employees: User[] = [
  { id: 'emp-1', name: 'Kyle', role: 'employee', dailyRate: 250 },
  { id: 'emp-2', name: 'Hao', role: 'employee', dailyRate: 250 },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'APEC 2026',
    startDate: '2026-03-01',
    endDate: '2026-04-15',
    booths: [
      {
        id: 'booth-1',
        projectId: 'proj-1',
        clientName: 'Itech',
        totalContract: 15500,
        payments: [
          { id: 'pay-1', boothId: 'booth-1', type: 'deposit', amount: 7750, status: 'received', receivedDate: '2026-03-01', notes: '首款已收' },
          { id: 'pay-2', boothId: 'booth-1', type: 'balance', amount: 7750, status: 'invoiced', invoiceDate: '2026-04-01', notes: '尾款已开票，已打款未收到回执' },
        ],
      },
      {
        id: 'booth-2',
        projectId: 'proj-1',
        clientName: 'Kewell',
        totalContract: 10000,
        payments: [
          { id: 'pay-3', boothId: 'booth-2', type: 'deposit', amount: 7000, status: 'received', receivedDate: '2026-03-01', notes: '首款已收' },
          { id: 'pay-4', boothId: 'booth-2', type: 'balance', amount: 3000, status: 'invoiced', invoiceDate: '2026-04-01', notes: '尾款已开票，已打款未收到回执' },
        ],
      },
    ],
    expenses: [
      // 差旅 - Ami
      { id: 'e1', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: 'Airbnb', amount: 747.27, description: 'Airbnb住宿', date: '2026-03-05' },
      { id: 'e2', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: 'Flight', amount: 309.20, description: '机票', date: '2026-03-01' },
      { id: 'e3', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: 'Flight', amount: 265.40, description: '机票（回程）', date: '2026-04-10' },
      { id: 'e4', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: 'Hotel', amount: 200, description: '酒店', date: '2026-03-06' },
      { id: 'e5', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: 'Uber', amount: 150, description: 'Uber交通', date: '2026-03-07' },
      { id: 'e6', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: 'Gas', amount: 483.56, description: '加油', date: '2026-03-08' },
      { id: 'e7', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: 'Parking', amount: 106.50, description: '停车费', date: '2026-03-09' },
      { id: 'e8', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: '餐補', amount: 426.83, description: '餐费补贴', date: '2026-03-10' },
      { id: 'e9', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: '租車', amount: 266.77, description: '租车费用', date: '2026-03-04' },
      { id: 'e10', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '差旅', subCategory: 'Walmart', amount: 76.72, description: 'Walmart采购', date: '2026-03-11' },
      // 物料
      { id: 'e11', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '物料', subCategory: 'Amazon', amount: 49.78, description: 'Amazon物料采购', date: '2026-03-03' },
      // 人工
      { id: 'e12', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '人工', subCategory: '日薪', amount: 1250, description: 'Hao人工 5天×$250/day', date: '2026-03-15' },
      // Itech三方
      { id: 'e13', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '吊顶', amount: 4004.40, description: 'Itech吊顶', date: '2026-03-12' },
      { id: 'e14', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '劳工', amount: 420, description: 'Itech劳工', date: '2026-03-13' },
      { id: 'e15', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '木柜过磅', amount: 3472, description: 'Itech木柜过磅', date: '2026-03-14' },
      { id: 'e16', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '型材物料过磅', amount: 2460, description: 'Itech型材物料过磅', date: '2026-03-14' },
      { id: 'e17', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '布/吊顶过磅', amount: 401.76, description: 'Itech布/吊顶过磅', date: '2026-03-14' },
      { id: 'e18', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '电费', amount: 1012, description: 'Itech电费', date: '2026-03-15' },
      // Kewell三方
      { id: 'e19', projectId: 'proj-1', boothId: 'booth-2', paidBy: 'Ami', mainCategory: '三方', subCategory: '电费', amount: 164, description: 'Kewell电费', date: '2026-03-15' },
      // Kyle paid
      { id: 'e20', projectId: 'proj-1', paidBy: 'Kyle', mainCategory: '差旅', subCategory: 'Gas', amount: 580, description: 'Kyle加油', date: '2026-03-08' },
      { id: 'e21', projectId: 'proj-1', paidBy: 'Kyle', mainCategory: '差旅', subCategory: '餐補', amount: 320, description: 'Kyle餐费', date: '2026-03-10' },
      { id: 'e22', projectId: 'proj-1', paidBy: 'Kyle', mainCategory: '差旅', subCategory: 'Uber', amount: 180, description: 'Kyle Uber', date: '2026-03-09' },
      { id: 'e23', projectId: 'proj-1', paidBy: 'Kyle', mainCategory: '差旅', subCategory: 'Parking', amount: 65, description: 'Kyle停车', date: '2026-03-11' },
      { id: 'e24', projectId: 'proj-1', paidBy: 'Kyle', mainCategory: '差旅', subCategory: 'Hotel', amount: 429.16, description: 'Kyle酒店', date: '2026-03-06' },
    ],
    workLogs: [
      { id: 'wl-1', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-10', dailyRate: 250 },
      { id: 'wl-2', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-11', dailyRate: 250 },
      { id: 'wl-3', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-12', dailyRate: 250 },
      { id: 'wl-4', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-13', dailyRate: 250 },
      { id: 'wl-5', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-14', dailyRate: 250 },
    ],
  },
];
