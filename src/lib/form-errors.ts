import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { isApiError } from './api';

/** Puts server field errors next to their inputs; shows the general message as a toast. */
export function applyApiFieldErrors<T extends FieldValues>(form: UseFormReturn<T>, error: unknown): void {
  if (!isApiError(error)) {
    toast.error('Something went wrong. Please try again.');
    return;
  }
  const entries = Object.entries(error.fields).filter(([k]) => k !== '_');
  for (const [name, message] of entries) form.setError(name as Path<T>, { type: 'server', message });
  if (entries.length === 0 || error.code !== 'VALIDATION_FAILED') toast.error(error.message);
}
