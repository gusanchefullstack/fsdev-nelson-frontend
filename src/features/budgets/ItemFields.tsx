import { useWatch, type Control, type FieldValues, type Path } from 'react-hook-form';
import { MoneyField, SelectField, TextAreaField, TextField } from '@/components/fields';
import { frequencyLabels, options } from '@/lib/labels';

interface Props<T extends FieldValues> {
  control: Control<T>;
  currency: string;
  /** Prefix for nested forms, e.g. "categories.0.items.1." */
  prefix?: string;
  systemItem?: boolean;
}

/** Item fields shared by the item dialog and the Guided/Complete flows. */
export function ItemFields<T extends FieldValues>({ control, currency, prefix = '', systemItem }: Props<T>) {
  const p = (name: string) => `${prefix}${name}` as Path<T>;
  const frequency = useWatch({ control, name: p('frequency') }) as string | undefined;

  if (systemItem) {
    return (
      <MoneyField
        control={control}
        name={p('estimatedAmount')}
        label="Monthly allowance"
        currency={currency}
        description="Optional buffer for spending you didn't plan. Leave at 0 to only track it."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField control={control} name={p('name')} label="Name" placeholder="Rent" />
      <TextAreaField control={control} name={p('description')} label="Description" />
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField control={control} name={p('estimatedAmount')} label="Estimated amount" currency={currency} description="Expected each time it happens." />
        <SelectField control={control} name={p('frequency')} label="Frequency" options={options(frequencyLabels)} />
      </div>
      {frequency === 'CUSTOM' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={control} name={p('customInterval')} label="Every" type="number" inputMode="numeric" min={1} />
          <SelectField
            control={control}
            name={p('customUnit')}
            label="Unit"
            options={[
              { value: 'DAYS', label: 'Days' },
              { value: 'MONTHS', label: 'Months' },
            ]}
          />
        </div>
      )}
      <TextField
        control={control}
        name={p('estimatedExecutionDate')}
        label={frequency === 'ONE_TIME' ? 'Expected date' : 'First expected date'}
        type="date"
        description={frequency === 'ONE_TIME' ? undefined : 'Later dates repeat from this one.'}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name={p('startDate')} label="Start date" type="date" />
        <TextField control={control} name={p('endDate')} label="End date" type="date" description="Can't go past the budget end." />
      </div>
    </div>
  );
}
