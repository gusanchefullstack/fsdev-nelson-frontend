import { z } from 'zod';
import { isoDateString, moneyString, requiredText } from '@/lib/validation';

export const itemSchema = z
  .object({
    name: requiredText('Name', 80),
    description: requiredText('Description', 500),
    estimatedAmount: moneyString(),
    frequency: z.enum(['ONE_TIME', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'CUSTOM']),
    customInterval: z.string().optional(),
    customUnit: z.enum(['DAYS', 'MONTHS']).optional(),
    startDate: isoDateString('Start date'),
    endDate: isoDateString('End date'),
    estimatedExecutionDate: isoDateString('Execution date'),
  })
  .superRefine((v, ctx) => {
    if (v.endDate < v.startDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be on or after the start date' });
    if (v.estimatedExecutionDate < v.startDate || v.estimatedExecutionDate > v.endDate) {
      ctx.addIssue({ code: 'custom', path: ['estimatedExecutionDate'], message: 'Execution date must fall between the start and end dates' });
    }
    if (v.frequency === 'CUSTOM') {
      if (!v.customUnit) ctx.addIssue({ code: 'custom', path: ['customUnit'], message: 'Choose days or months' });
      const n = Number(v.customInterval);
      const max = v.customUnit === 'MONTHS' ? 24 : 365;
      if (!Number.isInteger(n) || n < 1 || n > max) ctx.addIssue({ code: 'custom', path: ['customInterval'], message: `Enter a whole number from 1 to ${max}` });
    }
  });

export type ItemValues = z.infer<typeof itemSchema>;

export const toItemInput = (v: ItemValues) => ({
  ...v,
  customInterval: v.frequency === 'CUSTOM' ? Number(v.customInterval) : null,
  customUnit: v.frequency === 'CUSTOM' ? (v.customUnit ?? null) : null,
});
