import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Combobox } from '@/components/Combobox';
import { PhoneField, isValidPhoneNumber } from '@/components/PhoneField';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { api, type Schemas } from '@/lib/api';
import { applyApiFieldErrors } from '@/lib/form-errors';
import { countryOptions, timeZoneOptions } from '@/lib/geo';
import { browserTimeZone } from '@/lib/temporal';
import { AvatarPicker } from './AvatarPicker';

const text = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

// Mirrors the server rules (backend src/modules/me/schemas.ts)
export const profileSchema = z.object({
  firstName: text('First name', 60),
  lastName: text('Last name', 60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Use at least 3 characters')
    .max(30, 'Use 30 characters or fewer')
    .regex(/^[a-z0-9_.]+$/, 'Use only letters, numbers, dots and underscores'),
  address: text('Address', 120),
  city: text('City', 120),
  state: text('State', 120),
  postalCode: text('Postal code', 20),
  country: z.string().regex(/^[A-Z]{2}$/, 'Choose a country'),
  phone: z.string().min(1, 'Phone number is required').refine((v) => isValidPhoneNumber(v), 'Enter a valid phone number for the selected country'),
  timeZone: z.string().min(1, 'Choose a time zone'),
  avatarUrl: z.string().min(1, 'Choose an avatar or upload a photo'),
});
export type ProfileValues = z.infer<typeof profileSchema>;

interface Props {
  initial?: Partial<ProfileValues>;
  submitLabel: string;
  onSaved: (me: Schemas['Me']) => void | Promise<void>;
}

export function ProfileForm({ initial, submitLabel, onSaved }: Props) {
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
      timeZone: browserTimeZone(),
      avatarUrl: '',
      ...initial,
    },
  });
  const country = useWatch({ control: form.control, name: 'country' });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const me = await api.put<Schemas['Me']>('/me/profile', values);
      await onSaved(me);
    } catch (e) {
      applyApiFieldErrors(form, e);
    }
  });

  const textField = (name: keyof ProfileValues, label: string, autoComplete?: string, className?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input autoComplete={autoComplete} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-8" noValidate>
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-lg font-semibold">About you</legend>
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <AvatarPicker value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {textField('firstName', 'First name', 'given-name')}
            {textField('lastName', 'Last name', 'family-name')}
          </div>
          {textField('username', 'Username', 'username')}
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-lg font-semibold">Contact and location</legend>
          {textField('address', 'Address', 'street-address')}
          <div className="grid gap-4 sm:grid-cols-2">
            {textField('city', 'City', 'address-level2')}
            {textField('state', 'State / province', 'address-level1')}
            {textField('postalCode', 'Postal code', 'postal-code')}
            <FormField
              control={form.control}
              name="country"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      options={countryOptions}
                      placeholder="Choose a country"
                      searchPlaceholder="Search countries…"
                      invalid={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <PhoneField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultCountry={country || 'US'}
                    invalid={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timeZone"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Time zone</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={timeZoneOptions}
                    placeholder="Choose a time zone"
                    searchPlaceholder="Search time zones…"
                    invalid={!!fieldState.error}
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">Transactions are recorded in this time zone.</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <Button type="submit" size="lg" className="self-start" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
