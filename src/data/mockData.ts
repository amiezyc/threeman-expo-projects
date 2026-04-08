import { Project, User } from '@/types';

export const currentUser: User = {
  id: 'boss-1',
  name: '老板',
  role: 'boss',
};

export const employees: User[] = [
  { id: 'emp-1', name: '张三', role: 'employee', dailyRate: 350 },
  { id: 'emp-2', name: '李四', role: 'employee', dailyRate: 300 },
  { id: 'emp-3', name: '王五', role: 'employee', dailyRate: 320 },
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
          {
            id: 'pay-1',
            boothId: 'booth-1',
            type: 'deposit',
            amount: 7750,
            status: 'received',
            receivedDate: '2026-03-01',
            notes: '首款已收',
          },
          {
            id: 'pay-2',
            boothId: 'booth-1',
            type: 'balance',
            amount: 7750,
            status: 'invoiced',
            invoiceDate: '2026-04-01',
            notes: '尾款invoice已开，已打款未收到回执',
          },
        ],
        expenses: [
          { id: 'exp-1', projectId: 'proj-1', boothId: 'booth-1', userId: 'boss-1', userName: '老板', category: '材料费', amount: 2800, description: '展架材料采购', date: '2026-03-05' },
          { id: 'exp-2', projectId: 'proj-1', boothId: 'booth-1', userId: 'emp-1', userName: '张三', category: '运输费', amount: 450, description: '材料运输', date: '2026-03-08' },
          { id: 'exp-3', projectId: 'proj-1', boothId: 'booth-1', userId: 'boss-1', userName: '老板', category: '设计费', amount: 1200, description: '展位设计', date: '2026-03-02' },
        ],
        workLogs: [
          { id: 'wl-1', projectId: 'proj-1', boothId: 'booth-1', userId: 'emp-1', userName: '张三', date: '2026-03-10', dailyRate: 350 },
          { id: 'wl-2', projectId: 'proj-1', boothId: 'booth-1', userId: 'emp-1', userName: '张三', date: '2026-03-11', dailyRate: 350 },
          { id: 'wl-3', projectId: 'proj-1', boothId: 'booth-1', userId: 'emp-2', userName: '李四', date: '2026-03-10', dailyRate: 300 },
        ],
      },
      {
        id: 'booth-2',
        projectId: 'proj-1',
        clientName: 'Kewell',
        totalContract: 10000,
        payments: [
          {
            id: 'pay-3',
            boothId: 'booth-2',
            type: 'deposit',
            amount: 7000,
            status: 'received',
            receivedDate: '2026-03-01',
            notes: '首款已收',
          },
          {
            id: 'pay-4',
            boothId: 'booth-2',
            type: 'balance',
            amount: 3000,
            status: 'invoiced',
            invoiceDate: '2026-04-01',
            notes: '尾款invoice已开，已打款未收到回执',
          },
        ],
        expenses: [
          { id: 'exp-4', projectId: 'proj-1', boothId: 'booth-2', userId: 'boss-1', userName: '老板', category: '材料费', amount: 1800, description: '展架材料', date: '2026-03-06' },
          { id: 'exp-5', projectId: 'proj-1', boothId: 'booth-2', userId: 'emp-2', userName: '李四', category: '餐饮住宿', amount: 320, description: '工人餐费', date: '2026-03-12' },
        ],
        workLogs: [
          { id: 'wl-4', projectId: 'proj-1', boothId: 'booth-2', userId: 'emp-2', userName: '李四', date: '2026-03-11', dailyRate: 300 },
          { id: 'wl-5', projectId: 'proj-1', boothId: 'booth-2', userId: 'emp-3', userName: '王五', date: '2026-03-11', dailyRate: 320 },
          { id: 'wl-6', projectId: 'proj-1', boothId: 'booth-2', userId: 'emp-3', userName: '王五', date: '2026-03-12', dailyRate: 320 },
        ],
      },
    ],
  },
];
