import { getCountries } from 'react-phone-number-input';
import type { ComboOption } from '@/components/Combobox';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const countryOptions: ComboOption[] = getCountries()
  .map((code) => ({ value: code, label: regionNames.of(code) ?? code, hint: code }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const countryName = (code: string | null | undefined): string =>
  code ? (regionNames.of(code) ?? code) : '';

function offsetLabel(timeZone: string): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? '';
}

export const timeZoneOptions: ComboOption[] = Intl.supportedValuesOf('timeZone').map((tz) => ({
  value: tz,
  label: tz.replace(/_/g, ' '),
  hint: offsetLabel(tz),
}));
