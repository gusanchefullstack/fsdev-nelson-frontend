import { queryOptions } from '@tanstack/react-query';
import { api, toQuery, type Model } from '@/lib/api';

export type ForecastVsActual = Model<'ForecastVsActual'>;
export type TopN = Model<'TopN'>;
export type Projection = Model<'Projection'>;
export type Insight = Model<'Insight'>;

const base = (id: string) => `/budgets/${id}/reports`;

export const forecastQuery = (id: string, level: 'budget' | 'category' | 'item', targetId?: string) =>
  queryOptions({
    queryKey: ['reports', id, 'fva', level, targetId],
    queryFn: () => api.get<ForecastVsActual>(`${base(id)}/forecast-vs-actual${toQuery({ level, targetId })}`),
    enabled: level === 'budget' || !!targetId,
  });

export const topQuery = (id: string, q: { n: 5 | 10; by: 'item' | 'counterparty'; from?: string; to?: string }) =>
  queryOptions({ queryKey: ['reports', id, 'top', q], queryFn: () => api.get<TopN>(`${base(id)}/top${toQuery(q)}`) });

export const projectionQuery = (id: string) =>
  queryOptions({ queryKey: ['reports', id, 'projection'], queryFn: () => api.get<Projection>(`${base(id)}/projection`) });

export const insightsQuery = (id: string) =>
  queryOptions({ queryKey: ['reports', id, 'insights'], queryFn: async () => (await api.get<{ data: Insight[] }>(`${base(id)}/insights`)).data });
