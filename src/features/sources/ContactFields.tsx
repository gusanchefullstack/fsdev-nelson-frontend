import { useWatch, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Combobox } from '@/components/Combobox';
import { TextField } from '@/components/fields';
import { PhoneField } from '@/components/PhoneField';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { countryOptions } from '@/lib/geo';

/** Optional address and phone section shared by accounts, payors and vendors. */
export function ContactFields<T extends FieldValues>({ control }: { control: Control<T> }) {
  const n = (s: string) => s as Path<T>;
  const country = useWatch({ control, name: n('country') }) as string | undefined;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 font-semibold">
        Contact details <span className="font-normal text-muted-foreground">(optional)</span>
      </legend>
      <TextField control={control} name={n('address')} label="Address" autoComplete="off" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name={n('city')} label="City" autoComplete="off" />
        <TextField control={control} name={n('state')} label="State / province" autoComplete="off" />
        <TextField control={control} name={n('postalCode')} label="Postal code" autoComplete="off" />
        <FormField
          control={control}
          name={n('country')}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Combobox value={field.value as string} onChange={field.onChange} options={countryOptions} placeholder="Choose a country" invalid={!!fieldState.error} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name={n('phone')}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Phone number</FormLabel>
            <FormControl>
              <PhoneField value={field.value as string} onChange={field.onChange} onBlur={field.onBlur} defaultCountry={country || 'US'} invalid={!!fieldState.error} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </fieldset>
  );
}
