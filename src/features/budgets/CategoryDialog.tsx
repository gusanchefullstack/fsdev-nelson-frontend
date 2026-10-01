import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { TextAreaField, TextField } from '@/components/fields';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import type { FlowKind } from '@/lib/api';
import { applyApiFieldErrors } from '@/lib/form-errors';
import { kindLabels } from '@/lib/labels';
import { optionalText, requiredText } from '@/lib/validation';
import { useSaveCategory, type Category } from './api';

const schema = z.object({ name: requiredText('Name', 80), description: optionalText(500) });
type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
  kind: FlowKind;
  category?: Category;
}

export function CategoryDialog({ open, onOpenChange, budgetId, kind, category }: Props) {
  const save = useSaveCategory(budgetId);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: category?.name ?? '', description: category?.description ?? '' },
  });
  const submit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(category ? { id: category.id, ...values } : { kind, ...values });
      toast.success(category ? 'Category updated' : 'Category added');
      onOpenChange(false);
    } catch (e) {
      applyApiFieldErrors(form, e);
    }
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit category' : `New ${kindLabels[kind].toLowerCase()} category`}</DialogTitle>
          <DialogDescription>Categories group related budget items, like Housing or Salaries.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
            <TextField control={form.control} name="name" label="Name" />
            <TextAreaField control={form.control} name="description" label="Description (optional)" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {category ? 'Save' : 'Add category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
