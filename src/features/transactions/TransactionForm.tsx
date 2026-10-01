import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { MoneyField, TextAreaField, TextField } from '@/components/fields';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { budgetQuery, budgetsQuery } from '@/features/budgets/api';
import { sourcesQuery } from '@/features/sources/api';
import { applyApiFieldErrors } from '@/lib/form-errors';
import { todayIso } from '@/lib/temporal';
import { cn } from '@/lib/utils';
import { isoDateString, moneyString, optionalText } from '@/lib/validation';
import type { Transaction, TransactionInput } from './api';

const schema = z
  .object({
    kind: z.enum(['INCOME', 'EXPENSE']),
    budgetId: z.string().min(1, 'Choose a budget'),
    itemId: z.string().min(1, 'Choose a budget item'),
    amount: moneyString(),
    date: isoDateString('Date'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time is required'),
    financialAccountId: z.string().min(1, 'Choose an account'),
    payorId: z.string().optional(),
    vendorId: z.string().optional(),
    note: optionalText(500),
  })
  .superRefine((v, ctx) => {
    if (Number(v.amount) <= 0) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Enter an amount greater than 0' });
    if (v.kind === 'INCOME' && !v.payorId) ctx.addIssue({ code: 'custom', path: ['payorId'], message: 'Choose who paid you' });
    if (v.kind === 'EXPENSE' && !v.vendorId) ctx.addIssue({ code: 'custom', path: ['vendorId'], message: 'Choose who you paid' });
  });
type Values = z.infer<typeof schema>;

interface Props {
  /** Zone used for new transactions (the profile zone) */
  profileTimeZone: string;
  initial?: Transaction;
  defaults?: { budgetId?: string; itemId?: string; kind?: 'INCOME' | 'EXPENSE' };
  submitLabel: string;
  onSubmit: (body: TransactionInput) => Promise<unknown>;
  onCancel?: () => void;
}

function toLocalParts(t: Transaction) {
  const zdt = Temporal.Instant.from(t.occurredAt).toZonedDateTimeISO(t.timeZone);
  return { date: zdt.toPlainDate().toString(), time: zdt.toPlainTime().toString({ smallestUnit: 'minute' }) };
}

function SimpleSelect({ value, onChange, placeholder, options, invalid }: { value: string | undefined; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[]; invalid?: boolean }) {
  return (
    <Select value={value ?? ''} onValueChange={onChange}>
      <FormControl>
        <SelectTrigger className="w-full" aria-invalid={invalid || undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TransactionForm({ profileTimeZone, initial, defaults, submitLabel, onSubmit, onCancel }: Props) {
  // Edits keep the zone the transaction was recorded in (FR-031)
  const timeZone = initial?.timeZone ?? profileTimeZone;
  const now = Temporal.Now.zonedDateTimeISO(timeZone);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          kind: initial.kind,
          budgetId: initial.budgetId,
          itemId: initial.itemId,
          amount: initial.amount,
          ...toLocalParts(initial),
          financialAccountId: initial.financialAccountId,
          payorId: initial.payorId ?? undefined,
          vendorId: initial.vendorId ?? undefined,
          note: initial.note ?? '',
        }
      : {
          kind: defaults?.kind ?? 'EXPENSE',
          budgetId: defaults?.budgetId ?? '',
          itemId: defaults?.itemId ?? '',
          amount: '',
          date: todayIso(timeZone),
          time: now.toPlainTime().toString({ smallestUnit: 'minute' }),
          financialAccountId: '',
          note: '',
        },
  });
  const [kind, budgetId, itemId] = useWatch({ control: form.control, name: ['kind', 'budgetId', 'itemId'] });

  const budgets = useQuery(budgetsQuery);
  const budget = useQuery({ ...budgetQuery(budgetId), enabled: !!budgetId });
  const accounts = useQuery(sourcesQuery('accounts'));
  const payors = useQuery(sourcesQuery('payors'));
  const vendors = useQuery(sourcesQuery('vendors'));

  // Default to the budget active today
  useEffect(() => {
    if (!budgetId && budgets.data?.length) {
      const active = budgets.data.find((b) => b.isActive) ?? budgets.data[0];
      if (active) form.setValue('budgetId', active.id);
    }
  }, [budgetId, budgets.data, form]);

  const currency = budget.data?.currency ?? 'USD';
  const categories = useMemo(() => (budget.data?.categories ?? []).filter((c) => c.kind === kind), [budget.data, kind]);
  // Clear an item that no longer matches the chosen kind or budget
  useEffect(() => {
    if (itemId && budget.data && !categories.some((c) => c.items.some((i) => i.id === itemId))) form.setValue('itemId', '');
  }, [categories, itemId, budget.data, form]);

  const accountOptions = (accounts.data ?? []).filter((a) => a.currency === currency).map((a) => ({ value: a.id, label: a.name }));
  const payorOptions = (payors.data ?? []).map((p) => ({ value: p.id, label: p.name }));
  const vendorOptions = (vendors.data ?? []).map((v) => ({ value: v.id, label: v.name }));

  const submit = form.handleSubmit(async (v) => {
    const occurredAt = Temporal.PlainDateTime.from(`${v.date}T${v.time}`)
      .toZonedDateTime(timeZone)
      .toString({ timeZoneName: 'never', smallestUnit: 'second' });
    try {
      await onSubmit({
        kind: v.kind,
        amount: v.amount,
        currency,
        occurredAt,
        timeZone: initial ? undefined : timeZone,
        itemId: v.itemId,
        financialAccountId: v.financialAccountId,
        payorId: v.kind === 'INCOME' ? v.payorId : null,
        vendorId: v.kind === 'EXPENSE' ? v.vendorId : null,
        note: v.note || null,
      });
    } catch (e) {
      applyApiFieldErrors(form, e, { occurredAt: 'date', currency: 'amount' });
    }
  });

  const accountField = (label: string) => (
    <FormField
      control={form.control}
      name="financialAccountId"
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <SimpleSelect value={field.value} onChange={field.onChange} placeholder="Choose an account" options={accountOptions} invalid={!!fieldState.error} />
          {accountOptions.length === 0 && <p className="text-sm text-muted-foreground">Add an account in {currency} first.</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
  const counterpartyField =
    kind === 'INCOME' ? (
      <FormField
        control={form.control}
        name="payorId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>From (payor)</FormLabel>
            <SimpleSelect value={field.value} onChange={field.onChange} placeholder="Who paid you?" options={payorOptions} invalid={!!fieldState.error} />
            <FormMessage />
          </FormItem>
        )}
      />
    ) : (
      <FormField
        control={form.control}
        name="vendorId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>To (vendor)</FormLabel>
            <SimpleSelect value={field.value} onChange={field.onChange} placeholder="Who did you pay?" options={vendorOptions} invalid={!!fieldState.error} />
            <FormMessage />
          </FormItem>
        )}
      />
    );

  return (
    <Form {...form}>
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-5" noValidate>
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel id="kind-label">Type</FormLabel>
              <div role="radiogroup" aria-labelledby="kind-label" className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                {(['EXPENSE', 'INCOME'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={field.value === k}
                    onClick={() => field.onChange(k)}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition',
                      field.value === k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {k === 'EXPENSE' ? 'Expense' : 'Income'}
                  </button>
                ))}
              </div>
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="budgetId"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Budget</FormLabel>
                <SimpleSelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Choose a budget"
                  options={(budgets.data ?? []).map((b) => ({ value: b.id, label: `${b.name} (${b.currency})` }))}
                  invalid={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="itemId"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Budget item</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full" aria-invalid={!!fieldState.error || undefined}>
                      <SelectValue placeholder="Choose an item" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectGroup key={c.id}>
                        <SelectLabel>{c.name}</SelectLabel>
                        {c.items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <MoneyField control={form.control} name="amount" label="Amount" currency={currency} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="date" label="Date" type="date" />
          <TextField control={form.control} name="time" label="Time" type="time" />
        </div>
        <p className="-mt-3 text-sm text-muted-foreground">
          {initial ? 'Recorded in' : 'Time zone:'} {timeZone.replace(/_/g, ' ')}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {kind === 'INCOME' ? (
            <>
              {counterpartyField}
              {accountField('Into (account)')}
            </>
          ) : (
            <>
              {accountField('From (account)')}
              {counterpartyField}
            </>
          )}
        </div>

        <TextAreaField control={form.control} name="note" label="Note (optional)" />
        {form.formState.errors.root && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving…' : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
