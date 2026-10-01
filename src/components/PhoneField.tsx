import { forwardRef } from 'react';
import PhoneInput, { type Value } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export { isValidPhoneNumber } from 'react-phone-number-input';

interface Props {
  id?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  defaultCountry?: string;
  invalid?: boolean;
  describedBy?: string;
}

const PhoneTextInput = forwardRef<HTMLInputElement, React.ComponentProps<'input'>>((props, ref) => (
  <Input ref={ref} {...props} />
));
PhoneTextInput.displayName = 'PhoneTextInput';

/** Country flag + calling code selector producing E.164 numbers (FR-005). */
export function PhoneField({ id, value, onChange, onBlur, defaultCountry = 'US', invalid, describedBy }: Props) {
  return (
    <PhoneInput
      id={id}
      international
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry as never}
      value={(value || undefined) as Value | undefined}
      onChange={(v) => onChange(v ?? '')}
      onBlur={onBlur}
      inputComponent={PhoneTextInput}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      countrySelectProps={{ 'aria-label': 'Phone country code' }}
      className={cn('nelson-phone flex items-center gap-2')}
    />
  );
}
