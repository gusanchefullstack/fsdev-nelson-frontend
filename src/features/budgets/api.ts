import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Model, type Schemas } from '@/lib/api';

export type BudgetSummary = Model<'BudgetSummary'>;
export type BudgetDetail = Model<'BudgetDetail'>;
export type Category = Model<'Category'>;
export type BudgetItem = Model<'BudgetItem'>;
export type Bucket = Model<'Bucket'>;
export type ItemWithBuckets = Model<'BudgetItemWithBuckets'>;
export type BudgetCreateInput = Schemas['BudgetCreateInput'];
export type BudgetUpdateInput = Schemas['BudgetUpdateInput'];
export type ItemInput = Schemas['BudgetItemInput'];
export type CategoryInput = Schemas['CategoryInput'];

export const budgetKeys = {
  all: ['budgets'] as const,
  detail: (id: string) => ['budgets', id] as const,
  item: (id: string) => ['items', id] as const,
};

export const budgetsQuery = queryOptions({
  queryKey: budgetKeys.all,
  queryFn: async () => (await api.get<{ data: BudgetSummary[] }>('/budgets')).data,
});

export const budgetQuery = (id: string) =>
  queryOptions({ queryKey: budgetKeys.detail(id), queryFn: () => api.get<BudgetDetail>(`/budgets/${id}`) });

export const itemQuery = (id: string) =>
  queryOptions({ queryKey: budgetKeys.item(id), queryFn: () => api.get<ItemWithBuckets>(`/items/${id}`) });

/** Anything that changes budget structure refreshes budgets, items and the dashboard. */
function useInvalidateBudgets() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: budgetKeys.all }),
      qc.invalidateQueries({ queryKey: ['items'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
      qc.invalidateQueries({ queryKey: ['deletion-impact'] }),
    ]);
}

export function useCreateBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (body: BudgetCreateInput) => api.post<BudgetDetail & { adjustments?: unknown[] }>('/budgets', body),
    onSuccess: invalidate,
  });
}

export function useUpdateBudget(id: string) {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (body: BudgetUpdateInput) => api.patch<BudgetDetail>(`/budgets/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({ mutationFn: (id: string) => api.delete(`/budgets/${id}`), onSuccess: invalidate });
}

export function useSaveCategory(budgetId: string) {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<CategoryInput> & { id?: string }) =>
      id ? api.patch<Category>(`/categories/${id}`, body) : api.post<Category>(`/budgets/${budgetId}/categories`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateBudgets();
  return useMutation({ mutationFn: (id: string) => api.delete(`/categories/${id}`), onSuccess: invalidate });
}

export function useSaveItem() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: ({ id, categoryId, body }: { id?: string; categoryId: string; body: ItemInput }) =>
      id
        ? api.put<BudgetItem & { adjustments?: string[] }>(`/items/${id}`, body)
        : api.post<BudgetItem & { adjustments?: string[] }>(`/categories/${categoryId}/items`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteItem() {
  const invalidate = useInvalidateBudgets();
  return useMutation({ mutationFn: (id: string) => api.delete(`/items/${id}`), onSuccess: invalidate });
}
