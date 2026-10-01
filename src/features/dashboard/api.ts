import { queryOptions } from '@tanstack/react-query';
import { api, type Model } from '@/lib/api';

export type Dashboard = Model<'Dashboard'>;

export const dashboardQuery = queryOptions({ queryKey: ['dashboard'], queryFn: () => api.get<Dashboard>('/dashboard') });
