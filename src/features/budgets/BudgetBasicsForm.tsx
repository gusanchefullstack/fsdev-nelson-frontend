import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Control, type FieldValues, type Path } from 'react-hook-form';
import { z } from 'zod';
import { SelectField, TextAreaField, TextField } from '@/components/fields';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import type { Currency } from '@/lib/api';
import { applyApiFieldErrors } from '@/lib/form-errors';
import { currencyLabels, options } from '@/lib/labels';
import { isoDateString, optionalText, requiredText } from '@/lib/validation';

export const budgetBasicsSchema = z
  .object({
    name: requiredText('Name', 80),
    description: optionalText(500),
    currency: z.enum(['USD', 'COP'], { error: 'Choose a currency' }),
    startDate: isoDateString('Start date'),
    endDate: isoDateString('End date'),
    alertThresholdPct: z.coerce
      .number<string | number>({ error: 'Enter a whole percentage' })
      .int('Enter a whole percentage')
      .min(1, 'Use a value from 1 to 100')
      .max(100, 'Use a value from 1 to 100'),
  })
  .refine((v) => v.endDate > v.startDate, { path: ['endDate'], message: 'End date must be after the start date' });

export type BudgetBasics = z.infer<typeof budgetBasicsSchema>;

interface Props {
  initial?: Partial<BudgetBasics>;
  /** Currency can't change after creation */
  lockCurrency?: boolean;
  submitLabel: string;
  onSubmit: (values: BudgetBasics) => Promise<unknown>;
  onCancel?: () => void;
}

export function BudgetBasicsForm({ initial, lockCurrency, submitLabel, onSubmit, onCancel }: Props) {
  const year = new Date().getFullYear() + 1;
  const form = useForm<z.input<typeof budgetBasicsSchema>, unknown, BudgetBasics>({
    resolver: zodResolver(budgetBasicsSchema),
    defaultValues: {
      name: '',
      description: '',
      currency: 'USD' as Currency,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      alertThresholdPct: 10,
      ...initial,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (e) {
      applyApiFieldErrors(form, e);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
        <BudgetBasicsFields control={form.control} lockCurrency={lockCurrency} />
        <div className="flex gap-2 pt-2">
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

/** Name, currency, dates and threshold — used by Lite, Guided and Complete. */
export function BudgetBasicsFields<T extends FieldValues>({ control, lockCurrency }: { control: Control<T>; lockCurrency?: boolean }) {
  const n = (s: string) => s as Path<T>;
  return (
    <div className="flex flex-col gap-4">
        <TextField control={control} name={n('name')} label="Budget name" placeholder="Household 2027" />
        <TextAreaField control={control} name={n('description')} label="Description (optional)" />
        <SelectField
          control={control}
          name={n('currency')}
          label="Currency"
          options={options(currencyLabels)}
          disabled={lockCurrency}
          description={lockCurrency ? "The currency can't be changed after the budget is created." : 'All items and transactions use this currency.'}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={control} name={n('startDate')} label="Start date" type="date" />
          <TextField control={control} name={n('endDate')} label="End date" type="date" />
        </div>
        <TextField
          control={control}
          name={n('alertThresholdPct')}
          label="Alert threshold (%)"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          description="Get an alert when income falls short, or spending runs over, by more than this."
        />
    </div>
  );
}
