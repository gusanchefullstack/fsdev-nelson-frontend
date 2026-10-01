import { z } from 'zod';

// Client-side mirrors of server rules; the server remains the source of truth
export const moneyString = (label = 'Amount') =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d{1,12}(\.\d{1,2})?$/, 'Enter an amount like 1250.00');

export const isoDateString = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} is required`);

export const optionalText = (max: number) => z.string().trim().max(max, `Use ${max} characters or fewer`).optional();

export const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);
