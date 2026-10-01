import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Money } from '@/components/Money';
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
import { formatDateRange } from '@/lib/format';
import { frequencyLabels } from '@/lib/labels';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app/budgets/new/guided')({ component: GuidedBudget });

const STEPS = [
  { key: 'basics', title: 'Basics', hint: 'Name, currency and period.' },
  {
    key: 'incomeCategories',
    title: 'Income categories',
    hint: 'Group your income, e.g. Salaries or Investments.',
  },
  {
    key: 'incomeItems',
    title: 'Income items',
    hint: 'What you expect to receive, how much and how often.',
  },
  {
    key: 'expenseCategories',
    title: 'Expense categories',
    hint: 'Group your spending, e.g. Housing or Utilities.',
  },
  {
    key: 'expenseItems',
    title: 'Expense items',
    hint: 'What you expect to pay, how much and how often.',
  },
  { key: 'review', title: 'Review', hint: 'Check everything, then create your budget.' },
] as const;

const BASICS = [
  'name',
  'description',
  'currency',
  'startDate',
  'endDate',
  'alertThresholdPct',
] as const;

function GuidedBudget() {
  const [step, setStep] = useState(0);
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
  const headingRef = useRef<HTMLHeadingElement>(null);
  const current = STEPS[step]!;

  const go = async (to: number) => {
    if (to > step) {
      const ok = await form.trigger(
        step === 0 ? [...BASICS] : step < 5 ? ['categories'] : undefined,
        { shouldFocus: true },
      );
      if (!ok) return;
    }
    setStep(to);
    // Move focus to the new step heading for screen reader and keyboard users
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const submit = (e: React.FormEvent) =>
    form.handleSubmit(
      async (values) => {
        try {
          const budget = await create.mutateAsync(toCreatePayload(values, 'GUIDED'));
          saved.current = true;
          toast.success('Budget created');
          await navigate({ to: '/budgets/$budgetId', params: { budgetId: budget.id } });
        } catch (e) {
          applyApiFieldErrors(form, e);
        }
      },
      () => toast.error('Some steps need attention. Go back and check the highlighted fields.'),
    )(e);

  return (
    <>
      <LeaveGuard shouldBlock={() => isDirty && !saved.current} />
      <PageHeader
        title="New budget · guided"
        description="We'll go step by step. Nothing is saved until you confirm at the end."
      />
      <nav aria-label="Progress" className="mb-6">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s.key} aria-current={i === step ? 'step' : undefined}>
              <span
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1 text-sm',
                  i === step && 'border-primary bg-primary-soft text-primary',
                  i < step && 'text-foreground',
                  i > step && 'text-muted-foreground',
                )}
              >
                <span className="tabular grid size-5 place-items-center rounded-full bg-muted text-xs">
                  {i < step ? <Check className="size-3" aria-hidden /> : i + 1}
                </span>
                <span className={cn(i !== step && 'hidden md:inline')}>{s.title}</span>
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <FormProvider {...form}>
        <form onSubmit={(e) => void submit(e)} noValidate className="max-w-3xl">
          <div className="rounded-xl border bg-card p-6">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
              Step {step + 1} of {STEPS.length}: {current.title}
            </h2>
            <p className="mb-6 text-muted-foreground">{current.hint}</p>
            {current.key === 'basics' && <BudgetBasicsFields control={form.control} />}
            {current.key === 'incomeCategories' && <TreeCategories kind="INCOME" />}
            {current.key === 'incomeItems' && <TreeCategories kind="INCOME" withItems />}
            {current.key === 'expenseCategories' && <TreeCategories kind="EXPENSE" />}
            {current.key === 'expenseItems' && <TreeCategories kind="EXPENSE" withItems />}
            {current.key === 'review' && <Review />}
          </div>
          <div className="mt-4 flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => void go(step - 1)}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              // Distinct keys: reusing one <button> lets the "Next" click submit once it turns into "Create budget"
              <Button key="next" type="button" onClick={() => void go(step + 1)}>
                Next
              </Button>
            ) : (
              <Button key="submit" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating…' : 'Create budget'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </>
  );
}

function Review() {
  const values = useWatch<TreeInput>() as TreeInput;
  const currency = values.currency ?? 'USD';
  return (
    <div className="flex flex-col gap-6">
      <dl className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="label-caps">Name</dt>
          <dd>{values.name}</dd>
        </div>
        <div>
          <dt className="label-caps">Period</dt>
          <dd className="tabular">
            {formatDateRange(values.startDate, values.endDate, { withYear: true })}
          </dd>
        </div>
        <div>
          <dt className="label-caps">Currency</dt>
          <dd>{currency}</dd>
        </div>
      </dl>
      {(['INCOME', 'EXPENSE'] as const).map((kind) => {
        const cats = (values.categories ?? []).filter((c) => c.kind === kind);
        return (
          <section
            key={kind}
            aria-label={kind === 'INCOME' ? 'Income summary' : 'Expenses summary'}
          >
            <h3
              className={cn(
                'font-display font-semibold uppercase',
                kind === 'INCOME' ? 'text-primary' : 'text-info',
              )}
            >
              {kind === 'INCOME' ? 'Income' : 'Expenses'}
            </h3>
            {cats.length === 0 ? (
              <p className="text-sm text-muted-foreground">None — you can add them later.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {cats.map((c, i) => (
                  <li key={i}>
                    <p className="font-medium">{c.name}</p>
                    <ul className="ml-4 text-sm text-muted-foreground">
                      {c.items.map((it, j) => (
                        <li key={j}>
                          {it.name} · {frequencyLabels[it.frequency]} ·{' '}
                          {it.estimatedAmount ? (
                            <Money amount={it.estimatedAmount} currency={currency} />
                          ) : (
                            '—'
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      <p className="text-sm text-muted-foreground">
        An “Unplanned” income and expense category will also be added automatically.
      </p>
    </div>
  );
}
