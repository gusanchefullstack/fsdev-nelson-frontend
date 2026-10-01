import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { useCreateBudget } from '@/features/budgets/api';
import { BudgetBasicsFields } from '@/features/budgets/BudgetBasicsForm';
import {
  LeaveGuard,
  TreeCategories,
  emptyTree,
  toCreatePayload,
  treeSchema,
  type TreeInput,
  type TreeValues,
} from '@/features/budgets/tree';
import { applyApiFieldErrors } from '@/lib/form-errors';

export const Route = createFileRoute('/_app/budgets/new/complete')({ component: CompleteBudget });

function CompleteBudget() {
  const saved = useRef(false);
  const navigate = useNavigate();
  const create = useCreateBudget();
  const form = useForm<TreeInput, unknown, TreeValues>({
    resolver: zodResolver(treeSchema),
    defaultValues: emptyTree(),
    mode: 'onTouched',
  });
  // Read during render so react-hook-form tracks dirtiness for the leave guard
  const { isDirty } = form.formState;

  const submit = (e: React.FormEvent) =>
    form.handleSubmit(
      async (values) => {
        try {
          const budget = await create.mutateAsync(toCreatePayload(values, 'COMPLETE'));
          saved.current = true;
          toast.success('Budget created');
          await navigate({ to: '/budgets/$budgetId', params: { budgetId: budget.id } });
        } catch (e) {
          applyApiFieldErrors(form, e);
        }
      },
      () => toast.error('Please fix the highlighted fields.'),
    )(e);

  return (
    <>
      <LeaveGuard shouldBlock={() => isDirty && !saved.current} />
      <PageHeader
        title="New budget · complete"
        description="Build the whole budget on one screen. Nothing is saved until you create it."
      />
      <FormProvider {...form}>
        <form onSubmit={(e) => void submit(e)} noValidate className="flex max-w-4xl flex-col gap-8">
          <section aria-labelledby="basics-h" className="rounded-xl border bg-card p-6">
            <h2 id="basics-h" className="mb-4 text-lg font-semibold">
              Basics
            </h2>
            <BudgetBasicsFields control={form.control} />
          </section>
          <section aria-labelledby="income-h">
            <h2
              id="income-h"
              className="mb-3 font-display text-lg font-semibold uppercase text-primary"
            >
              Income
            </h2>
            <TreeCategories kind="INCOME" withItems collapsible />
          </section>
          <section aria-labelledby="expense-h">
            <h2
              id="expense-h"
              className="mb-3 font-display text-lg font-semibold uppercase text-info"
            >
              Expenses
            </h2>
            <TreeCategories kind="EXPENSE" withItems collapsible />
          </section>
          <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating…' : 'Create budget'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </>
  );
}
