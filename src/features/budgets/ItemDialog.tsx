import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { applyApiFieldErrors } from '@/lib/form-errors';
import { formatDate } from '@/lib/format';
import { useSaveItem, type BudgetItem } from './api';
import { ItemFields } from './ItemFields';
import { itemSchema, toItemInput, type ItemValues } from './itemSchema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: { startDate: string; endDate: string; currency: string };
  categoryId: string;
  categoryName: string;
  item?: BudgetItem;
}

export function ItemDialog({ open, onOpenChange, budget, categoryId, categoryName, item }: Props) {
  const save = useSaveItem();
  const form = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    values: item
      ? {
          name: item.name,
          description: item.description,
          estimatedAmount: item.estimatedAmount,
          frequency: item.frequency,
          customInterval: item.customInterval ? String(item.customInterval) : '',
          customUnit: item.customUnit ?? undefined,
          startDate: item.startDate,
          endDate: item.endDate,
          estimatedExecutionDate: item.estimatedExecutionDate,
        }
      : {
          name: '',
          description: '',
          estimatedAmount: '',
          frequency: 'MONTHLY',
          customInterval: '',
          customUnit: undefined,
          startDate: budget.startDate,
          endDate: budget.endDate,
          estimatedExecutionDate: budget.startDate,
        },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({ id: item?.id, categoryId, body: toItemInput(values) });
      if (saved.adjustments?.includes('END_DATE_CLIPPED')) {
        toast.info(`End date was set to the budget end (${formatDate(budget.endDate)}).`);
      }
      toast.success(item ? 'Item updated' : 'Item added');
      onOpenChange(false);
      form.reset();
    } catch (e) {
      applyApiFieldErrors(form, e);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? `Edit ${item.name}` : 'Add item'}</DialogTitle>
          <DialogDescription>
            {categoryName} · {budget.currency}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void submit(e)} noValidate>
            <ItemFields control={form.control} currency={budget.currency} systemItem={item?.isSystem} />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : item ? 'Save item' : 'Add item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
