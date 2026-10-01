import { useBlocker } from '@tanstack/react-router';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch, type FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { TextField } from '@/components/fields';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { FlowKind } from '@/lib/api';
import { cn } from '@/lib/utils';
import { requiredText } from '@/lib/validation';
import { budgetBasicsSchema } from './BudgetBasicsForm';
import { ItemFields } from './ItemFields';
import { itemSchema, toItemInput } from './itemSchema';

/** A whole budget tree, shared by the Guided and Complete flows (FR-022). */
export const treeSchema = budgetBasicsSchema.and(
  z.object({
    categories: z.array(
      z.object({
        kind: z.enum(['INCOME', 'EXPENSE']),
        name: requiredText('Category name', 80),
        description: z.string().optional(),
        items: z.array(itemSchema),
      }),
    ),
  }),
);
export type TreeInput = z.input<typeof treeSchema>;
export type TreeValues = z.output<typeof treeSchema>;

export const emptyTree = (): TreeInput => {
  const year = new Date().getFullYear() + 1;
  return { name: '', description: '', currency: 'USD', startDate: `${year}-01-01`, endDate: `${year}-12-31`, alertThresholdPct: 10, categories: [] };
};

export const toCreatePayload = (v: TreeValues, mode: 'GUIDED' | 'COMPLETE') => ({
  ...v,
  mode,
  categories: v.categories.map((c) => ({ ...c, items: c.items.map(toItemInput) })),
});

export function newItem(start: string, end: string) {
  return { name: '', description: '', estimatedAmount: '', frequency: 'MONTHLY' as const, customInterval: '', customUnit: undefined, startDate: start, endDate: end, estimatedExecutionDate: start };
}

/** Item list for one category inside the tree form. */
export function TreeItems({ index }: { index: number }) {
  const { control } = useFormContext<TreeInput>();
  const { fields, append, remove } = useFieldArray({ control, name: `categories.${index}.items` });
  const [currency, start, end] = useWatch({ control, name: ['currency', 'startDate', 'endDate'] });
  const categoryName = useWatch({ control, name: `categories.${index}.name` });
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, i) => (
        <fieldset key={field.id} className="rounded-lg border bg-background p-4">
          <legend className="sr-only">
            Item {i + 1} in {categoryName || 'category'}
          </legend>
          <div className="mb-3 flex items-center justify-between">
            <span className="label-caps">Item {i + 1}</span>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove item ${i + 1} from ${categoryName || 'category'}`} onClick={() => remove(i)}>
              <Trash2 aria-hidden />
            </Button>
          </div>
          <ItemFields control={control} currency={currency} prefix={`categories.${index}.items.${i}.`} />
        </fieldset>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => append(newItem(start, end))}>
        <Plus aria-hidden /> Add item{categoryName ? ` to ${categoryName}` : ''}
      </Button>
    </div>
  );
}

/** Category names for one kind; indexes refer to the shared `categories` array. */
export function TreeCategories({ kind, withItems, collapsible }: { kind: FlowKind; withItems?: boolean; collapsible?: boolean }) {
  const { control, formState } = useFormContext<TreeInput>();
  const { fields, append, remove } = useFieldArray({ control, name: 'categories' });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const entries = fields.map((f, index) => ({ f, index })).filter(({ f }) => f.kind === kind);
  const label = kind === 'INCOME' ? 'income' : 'expense';
  const errors = formState.errors.categories as FieldErrors<TreeInput>['categories'];

  return (
    <div className="flex flex-col gap-3">
      {entries.length === 0 && <p className="text-sm text-muted-foreground">No {label} categories yet.</p>}
      {entries.map(({ f, index }) => {
        const isCollapsed = collapsible && collapsed[f.id];
        const hasError = !!errors?.[index];
        return (
          <section key={f.id} className={cn('rounded-xl border bg-card p-4', hasError && 'border-destructive')} aria-label={`${label} category ${index + 1}`}>
            <div className="flex items-end gap-2">
              {collapsible && withItems && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
                  onClick={() => setCollapsed((c) => ({ ...c, [f.id]: !c[f.id] }))}
                >
                  <ChevronDown className={cn('transition', isCollapsed && '-rotate-90')} aria-hidden />
                </Button>
              )}
              <TextField control={control} name={`categories.${index}.name`} label="Category name" className="flex-1" />
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove category ${index + 1}`} onClick={() => remove(index)}>
                <Trash2 aria-hidden />
              </Button>
            </div>
            {withItems && !isCollapsed && (
              <div className="mt-4">
                <TreeItems index={index} />
              </div>
            )}
          </section>
        );
      })}
      <Button type="button" variant="outline" className="self-start" onClick={() => append({ kind, name: '', description: '', items: [] })}>
        <Plus aria-hidden /> Add {label} category
      </Button>
    </div>
  );
}

/** Asks before leaving an unsaved Guided/Complete flow; nothing is saved if they leave (FR-022). */
export function LeaveGuard({ shouldBlock }: { shouldBlock: () => boolean }) {
  // Evaluated when navigation happens, so it sees the latest form state
  const blocker = useBlocker({ shouldBlockFn: shouldBlock, enableBeforeUnload: shouldBlock, withResolver: true });
  return (
    <AlertDialog open={blocker.status === 'blocked'}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>Your budget hasn't been created yet. If you leave now, nothing will be saved.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>Keep editing</AlertDialogCancel>
          <AlertDialogAction onClick={() => blocker.proceed?.()}>Leave</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
