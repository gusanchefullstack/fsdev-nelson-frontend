import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { MoneyField, SelectField, TextAreaField, TextField } from '@/components/fields';
import { isValidPhoneNumber } from '@/components/PhoneField';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { applyApiFieldErrors } from '@/lib/form-errors';
import { currencyLabels, options } from '@/lib/labels';
import { optionalText, requiredText } from '@/lib/validation';
import type { Source } from './api';
import type { SourceConfig } from './config';
import { ContactFields } from './ContactFields';

const baseSchema = z.object({
  name: requiredText('Name', 80),
  description: optionalText(500),
  type: z.string().min(1, 'Choose a type'),
  currency: z.enum(['USD', 'COP'], { error: 'Choose a currency' }),
  openingBalance: z.string().optional(),
  address: optionalText(120),
  city: optionalText(120),
  postalCode: optionalText(20),
  state: optionalText(120),
  country: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || isValidPhoneNumber(v), 'Enter a valid phone number for the selected country'),
});
type Values = z.infer<typeof baseSchema>;

interface Props {
  config: SourceConfig;
  initial?: Source;
  submitLabel: string;
  onSubmit: (body: object) => Promise<unknown>;
  onCancel?: () => void;
  currencyLocked?: boolean;
}

export function SourceForm({ config, initial, submitLabel, onSubmit, onCancel, currencyLocked }: Props) {
  const schema = config.hasBalance
    ? baseSchema.refine((v) => /^-?\d{1,12}(\.\d{1,2})?$/.test(v.openingBalance ?? ''), {
        path: ['openingBalance'],
        message: 'Enter a balance like 1250.00 (use - for money owed)',
      })
    : baseSchema;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      type: initial?.type ?? '',
      currency: initial?.currency ?? 'USD',
      openingBalance: initial?.openingBalance ?? '',
      address: initial?.address ?? '',
      city: initial?.city ?? '',
      postalCode: initial?.postalCode ?? '',
      state: initial?.state ?? '',
      country: initial?.country ?? '',
      phone: initial?.phone ?? '',
    },
  });
  const currency = useWatch({ control: form.control, name: 'currency' });

  const submit = form.handleSubmit(async ({ openingBalance, ...values }) => {
    try {
      await onSubmit(config.hasBalance ? { ...values, openingBalance } : values);
    } catch (e) {
      applyApiFieldErrors(form, e);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-4">
          <TextField control={form.control} name="name" label="Name" />
          <TextAreaField control={form.control} name="description" label="Description (optional)" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField control={form.control} name="type" label="Type" options={options(config.typeLabels)} />
            <SelectField
              control={form.control}
              name="currency"
              label="Currency"
              options={options(currencyLabels)}
              disabled={currencyLocked}
              description={currencyLocked ? "Can't change once the account has transactions." : undefined}
            />
          </div>
          {config.hasBalance && (
            <MoneyField
              control={form.control}
              name="openingBalance"
              label="Current balance"
              currency={currency}
              description="The balance today. Transactions you record will update it."
            />
          )}
        </div>
        <ContactFields control={form.control} />
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
