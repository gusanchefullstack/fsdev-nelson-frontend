import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { BarChart3, Lock, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Money } from '@/components/Money';
import { PageHeader } from '@/components/PageHeader';
import { BucketGauge } from '@/components/viz/BucketGauge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  budgetQuery,
  useDeleteBudget,
  useDeleteCategory,
  useDeleteItem,
  useUpdateBudget,
  type BudgetDetail,
  type BudgetItem,
  type Category,
} from '@/features/budgets/api';
import { BudgetBasicsForm } from '@/features/budgets/BudgetBasicsForm';
import { CategoryDialog } from '@/features/budgets/CategoryDialog';
import { ItemDialog } from '@/features/budgets/ItemDialog';
import type { FlowKind } from '@/lib/api';
import { formatDate, formatDateRange } from '@/lib/format';
import { frequencyLabels } from '@/lib/labels';

export const Route = createFileRoute('/_app/budgets/$budgetId/')({ component: BudgetPage });

type ItemDialogState = { category: Category; item?: BudgetItem } | null;
type CategoryDialogState = { kind: FlowKind; category?: Category } | null;

function BudgetPage() {
  const { budgetId } = Route.useParams();
  const { data: budget, isPending } = useQuery(budgetQuery(budgetId));
  const [editing, setEditing] = useState(false);
  const [itemDialog, setItemDialog] = useState<ItemDialogState>(null);
  const [categoryDialog, setCategoryDialog] = useState<CategoryDialogState>(null);
  const navigate = useNavigate();
  const update = useUpdateBudget(budgetId);
  const remove = useDeleteBudget();

  if (isPending || !budget) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={budget.name}
        eyebrow={
          <>
            <Badge variant="outline">{budget.currency}</Badge>
            {budget.isActive && <Badge className="bg-primary-soft text-primary">Active</Badge>}
            <span className="tabular">{formatDateRange(budget.startDate, budget.endDate, { withYear: true })}</span>
          </>
        }
        description={budget.description ?? undefined}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/budgets/$budgetId/reports" params={{ budgetId }}>
                <BarChart3 aria-hidden /> Reports
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden /> Edit
            </Button>
            <ConfirmDeleteDialog
              trigger={
                <Button variant="outline">
                  <Trash2 aria-hidden /> Delete
                </Button>
              }
              title={`Delete ${budget.name}?`}
              impactPath={`/budgets/${budgetId}/deletion-impact`}
              pending={remove.isPending}
              onConfirm={async () => {
                await remove.mutateAsync(budgetId);
                toast.success('Budget deleted');
                await navigate({ to: '/budgets' });
              }}
            />
          </>
        }
      />

      <Totals budget={budget} />

      <div className="mt-8 flex flex-col gap-8">
        {(['INCOME', 'EXPENSE'] as const).map((kind) => (
          <KindSection
            key={kind}
            kind={kind}
            budget={budget}
            onAddCategory={() => setCategoryDialog({ kind })}
            onEditCategory={(category) => setCategoryDialog({ kind, category })}
            onAddItem={(category) => setItemDialog({ category })}
            onEditItem={(category, item) => setItemDialog({ category, item })}
          />
        ))}
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit budget</DialogTitle>
            <DialogDescription>Changing dates moves items to fit and rebuilds their buckets.</DialogDescription>
          </DialogHeader>
          <BudgetBasicsForm
            lockCurrency
            initial={{ ...budget, description: budget.description ?? '' }}
            submitLabel="Save changes"
            onCancel={() => setEditing(false)}
            onSubmit={async ({ currency: _c, ...values }) => {
              await update.mutateAsync(values);
              toast.success('Budget updated');
              setEditing(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {itemDialog && (
        <ItemDialog
          open
          onOpenChange={(o) => !o && setItemDialog(null)}
          budget={budget}
          categoryId={itemDialog.category.id}
          categoryName={itemDialog.category.name}
          item={itemDialog.item}
        />
      )}
      {categoryDialog && (
        <CategoryDialog
          open
          onOpenChange={(o) => !o && setCategoryDialog(null)}
          budgetId={budgetId}
          kind={categoryDialog.kind}
          category={categoryDialog.category}
        />
      )}
    </>
  );
}

function Totals({ budget }: { budget: BudgetDetail }) {
  const t = budget.totals;
  const cards = [
    { label: 'Income to date', actual: t.actualIncomeToDate, expected: t.expectedIncomeToDate, tone: 'text-primary' },
    { label: 'Expenses to date', actual: t.actualExpenseToDate, expected: t.expectedExpenseToDate, tone: '' },
    { label: 'Unbudgeted spending', actual: t.unbudgetedExpense, expected: null, tone: 'text-warning' },
  ];
  return (
    <section aria-label="Totals" className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border bg-card p-5">
          <p className="label-caps">{c.label}</p>
          <p className={`mt-2 text-2xl font-semibold ${c.tone}`}>
            <Money amount={c.actual} currency={budget.currency} />
          </p>
          {c.expected !== null && (
            <p className="mt-1 text-sm text-muted-foreground">
              of <Money amount={c.expected} currency={budget.currency} /> expected so far
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

interface SectionProps {
  kind: FlowKind;
  budget: BudgetDetail;
  onAddCategory: () => void;
  onEditCategory: (c: Category) => void;
  onAddItem: (c: Category) => void;
  onEditItem: (c: Category, i: BudgetItem) => void;
}

function KindSection({ kind, budget, onAddCategory, onEditCategory, onAddItem, onEditItem }: SectionProps) {
  const categories = budget.categories.filter((c) => c.kind === kind);
  const deleteCategory = useDeleteCategory();
  const title = kind === 'INCOME' ? 'Income' : 'Expenses';
  const headingId = `section-${kind}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={headingId} className={`font-display text-lg font-semibold uppercase tracking-wide ${kind === 'INCOME' ? 'text-primary' : 'text-info'}`}>
          {title}
        </h2>
        <Button variant="outline" size="sm" onClick={onAddCategory}>
          <Plus aria-hidden /> Add category
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        {categories.map((category) => (
          <article key={category.id} className="rounded-xl border bg-card">
            <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-semibold">
                  {category.name}
                  {category.isSystem && <Lock className="size-4 text-muted-foreground" aria-label="Built-in category" />}
                </h3>
                {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                {!category.isSystem && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => onAddItem(category)}>
                      <Plus aria-hidden /> Item
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${category.name}`} onClick={() => onEditCategory(category)}>
                      <Pencil aria-hidden />
                    </Button>
                    <ConfirmDeleteDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${category.name}`}>
                          <Trash2 aria-hidden />
                        </Button>
                      }
                      title={`Delete ${category.name}?`}
                      impactPath={`/categories/${category.id}/deletion-impact`}
                      onConfirm={async () => {
                        await deleteCategory.mutateAsync(category.id);
                        toast.success('Category deleted');
                      }}
                    />
                  </>
                )}
              </div>
            </header>
            {category.items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No items yet.{' '}
                <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => onAddItem(category)}>
                  Add the first one
                </button>
              </p>
            ) : (
              <ul className="divide-y">
                {category.items.map((item) => (
                  <ItemRow key={item.id} budget={budget} category={category} item={item} onEdit={() => onEditItem(category, item)} />
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ItemRow({ budget, category, item, onEdit }: { budget: BudgetDetail; category: Category; item: BudgetItem; onEdit: () => void }) {
  const remove = useDeleteItem();
  const [confirming, setConfirming] = useState(false);
  const schedule = item.isSystem
    ? item.estimatedAmount === '0.00'
      ? 'Tracked only'
      : 'Monthly allowance'
    : `${frequencyLabels[item.frequency]} · from ${formatDate(item.estimatedExecutionDate)}`;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Link
          to="/budgets/$budgetId/items/$itemId"
          params={{ budgetId: budget.id, itemId: item.id }}
          className="font-medium underline-offset-4 hover:underline"
        >
          {item.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {schedule}
          {!item.isSystem && (
            <>
              {' · '}
              <Money amount={item.estimatedAmount} currency={budget.currency} />
            </>
          )}
        </p>
      </div>
      {item.currentBucket && <BucketGauge name={item.name} bucket={item.currentBucket} className="h-10 w-9" />}
      <div className="text-right text-sm">
        <p className="tabular">
          <Money amount={item.actualToDate} currency={budget.currency} /> /{' '}
          <span className="text-muted-foreground">
            <Money amount={item.expectedToDate} currency={budget.currency} />
          </span>
        </p>
        <p className="text-xs text-muted-foreground">actual / expected to date</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${item.name}`}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil aria-hidden /> {item.isSystem ? 'Set allowance' : 'Edit'}
          </DropdownMenuItem>
          {!item.isSystem && (
            <DropdownMenuItem className="text-destructive" onSelect={() => setConfirming(true)}>
              <Trash2 aria-hidden /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${item.name} from ${category.name}?`}
        impactPath={`/items/${item.id}/deletion-impact`}
        pending={remove.isPending}
        onConfirm={async () => {
          await remove.mutateAsync(item.id);
          toast.success('Item deleted');
        }}
      />
    </li>
  );
}
