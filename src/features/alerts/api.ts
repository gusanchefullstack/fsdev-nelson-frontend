import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Model } from '@/lib/api';

export type Alert = Model<'Alert'>;

export const alertsQuery = queryOptions({
  queryKey: ['alerts'],
  queryFn: () => api.get<{ data: Alert[]; unreadCount: number }>('/alerts'),
  // Keeps the badge fresh while the app is open (research R9)
  refetchInterval: 60_000,
});

export function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; read?: boolean; dismissed?: boolean }) => api.patch<Alert>(`/alerts/${id}`, patch),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['alerts'] }), qc.invalidateQueries({ queryKey: ['dashboard'] })]),
  });
}

export function useReadAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/alerts/read-all'),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['alerts'] }), qc.invalidateQueries({ queryKey: ['dashboard'] })]),
  });
}
