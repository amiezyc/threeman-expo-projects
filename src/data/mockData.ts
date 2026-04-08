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
    partners: [
      { name: 'Ami', percentage: 50 },
      { name: 'Daixi', percentage: 10 },
      { name: 'Kyle', percentage: 40 },
    ],
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
      { id: 'e11', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '物料', subCategory: 'Amazon', amount: 49.78, description: 'Amazon物料采购', date: '2026-03-03' },
      { id: 'e12', projectId: 'proj-1', paidBy: 'Ami', mainCategory: '人工', subCategory: '日薪', amount: 1250, description: 'Hao人工 5天×$250/day', date: '2026-03-15' },
      { id: 'e13', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '吊顶', amount: 4004.40, description: 'Itech吊顶', date: '2026-03-12' },
      { id: 'e14', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '劳工', amount: 420, description: 'Itech劳工', date: '2026-03-13' },
      { id: 'e15', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '木柜过磅', amount: 3472, description: 'Itech木柜过磅', date: '2026-03-14' },
      { id: 'e16', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '型材物料过磅', amount: 2460, description: 'Itech型材物料过磅', date: '2026-03-14' },
      { id: 'e17', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '布/吊顶过磅', amount: 401.76, description: 'Itech布/吊顶过磅', date: '2026-03-14' },
      { id: 'e18', projectId: 'proj-1', boothId: 'booth-1', paidBy: 'Ami', mainCategory: '三方', subCategory: '电费', amount: 1012, description: 'Itech电费', date: '2026-03-15' },
      { id: 'e19', projectId: 'proj-1', boothId: 'booth-2', paidBy: 'Ami', mainCategory: '三方', subCategory: '电费', amount: 164, description: 'Kewell电费', date: '2026-03-15' },
    ],
    workLogs: [
      { id: 'wl-1', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-10', dailyRate: 250, rateType: 'daily' as const },
      { id: 'wl-2', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-11', dailyRate: 250, rateType: 'daily' as const },
      { id: 'wl-3', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-12', dailyRate: 250, rateType: 'daily' as const },
      { id: 'wl-4', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-13', dailyRate: 250, rateType: 'daily' as const },
      { id: 'wl-5', projectId: 'proj-1', userId: 'emp-2', userName: 'Hao', date: '2026-03-14', dailyRate: 250, rateType: 'daily' as const },
    ],
  },
  {
    id: 'proj-2',
    name: '2025 SEMA',
    startDate: '2025-10-01',
    endDate: '2025-11-15',
    partners: [
      { name: 'Ami', percentage: 50 },
      { name: 'Daixi', percentage: 10 },
      { name: 'Kyle', percentage: 40 },
    ],
    booths: [
      {
        id: 'booth-3',
        projectId: 'proj-2',
        clientName: 'Rhine',
        totalContract: 6500,
        payments: [
          { id: 'pay-5', boothId: 'booth-3', type: 'deposit', amount: 3250, status: 'received', receivedDate: '2025-10-01', notes: '首款已收' },
          { id: 'pay-6', boothId: 'booth-3', type: 'balance', amount: 3250, status: 'received', receivedDate: '2025-11-20', notes: '尾款已收' },
        ],
      },
    ],
    expenses: [
      { id: 's1', projectId: 'proj-2', paidBy: 'Ami', mainCategory: '物料', subCategory: '画面', amount: 1480.50, description: '画面制作', date: '2025-10-10' },
      { id: 's2', projectId: 'proj-2', paidBy: 'Ami', mainCategory: '人工', subCategory: '人工搭建', amount: 500, description: '人工搭建+撤展', date: '2025-10-20' },
      { id: 's3', projectId: 'proj-2', paidBy: 'Ami', mainCategory: '物料', subCategory: '铝合金备料', amount: 300, description: '铝合金备料', date: '2025-10-08' },
      { id: 's4', projectId: 'proj-2', paidBy: 'Ami', mainCategory: '物料', subCategory: '地毯', amount: 342, description: '地毯（重新购买）', date: '2025-10-09' },
      { id: 's5', projectId: 'proj-2', paidBy: 'Ami', mainCategory: '物料', subCategory: '桌椅', amount: 400, description: '桌椅', date: '2025-10-09' },
      { id: 's6', projectId: 'proj-2', paidBy: 'Ami', mainCategory: '物料', subCategory: '电视', amount: 280.49, description: '43寸电视', date: '2025-10-10' },
    ],
    workLogs: [],
  },
];
