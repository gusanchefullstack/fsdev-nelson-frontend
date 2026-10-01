import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, toQuery, type Model, type Schemas } from '@/lib/api';

export type Transaction = Model<'Transaction'>;
export type TransactionInput = Schemas['TransactionInput'];
type WriteResult = Model<'TransactionWriteResult'>;

export interface TransactionFilters {
  budgetId?: string;
  itemId?: string;
  kind?: 'INCOME' | 'EXPENSE';
  financialAccountId?: string;
  payorId?: string;
  vendorId?: string;
  from?: string;
  to?: string;
}

export const transactionsQuery = (filters: TransactionFilters, limit = 25) =>
  infiniteQueryOptions({
    queryKey: ['transactions', filters, limit],
    queryFn: ({ pageParam }) =>
      api.get<{ data: Transaction[]; nextCursor: string | null }>(`/transactions${toQuery({ ...filters, limit, cursor: pageParam })}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const transactionQuery = (id: string) =>
  queryOptions({ queryKey: ['transactions', 'one', id], queryFn: () => api.get<Transaction>(`/transactions/${id}`) });

/** Money moved: refresh everything that shows balances, buckets, totals or alerts. */
function useInvalidateMoney() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      [['transactions'], ['budgets'], ['items'], ['sources', 'accounts'], ['dashboard'], ['alerts'], ['reports']].map((queryKey) =>
        qc.invalidateQueries({ queryKey }),
      ),
    );
}

function announceAlerts(result: WriteResult) {
  for (const alert of result.newAlerts ?? []) toast.warning(alert.message, { duration: 8000 });
}

export function useSaveTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: TransactionInput }) =>
      id ? api.put<WriteResult>(`/transactions/${id}`, body) : api.post<WriteResult>('/transactions', body),
    onSuccess: async (result) => {
      announceAlerts(result);
      await invalidate();
    },
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({ mutationFn: (id: string) => api.delete(`/transactions/${id}`), onSuccess: invalidate });
}
