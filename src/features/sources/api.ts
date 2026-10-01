import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Currency } from '@/lib/api';
import { SOURCES, type SourceKind } from './config';

/** Common shape of accounts, payors and vendors as returned by the API. */
export interface Source {
  id: string;
  name: string;
  description: string | null;
  type: string;
  currency: Currency;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  inUse: boolean;
  openingBalance?: string;
  currentBalance?: string;
}

export const sourcesQuery = (kind: SourceKind) =>
  queryOptions({
    queryKey: ['sources', kind],
    queryFn: async () => (await api.get<{ data: Source[] }>(SOURCES[kind].apiPath)).data,
  });

export const sourceQuery = (kind: SourceKind, id: string) =>
  queryOptions({ queryKey: ['sources', kind, id], queryFn: () => api.get<Source>(`${SOURCES[kind].apiPath}/${id}`) });

export function useSaveSource(kind: SourceKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: object }) =>
      id ? api.put<Source>(`${SOURCES[kind].apiPath}/${id}`, body) : api.post<Source>(SOURCES[kind].apiPath, body),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['sources', kind] }), qc.invalidateQueries({ queryKey: ['dashboard'] })]),
  });
}

export function useDeleteSource(kind: SourceKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${SOURCES[kind].apiPath}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources', kind] }),
  });
}
