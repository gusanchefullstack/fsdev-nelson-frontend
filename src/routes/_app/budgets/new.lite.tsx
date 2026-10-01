import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { useCreateBudget } from '@/features/budgets/api';
import { BudgetBasicsForm } from '@/features/budgets/BudgetBasicsForm';

export const Route = createFileRoute('/_app/budgets/new/lite')({ component: NewLiteBudget });

function NewLiteBudget() {
  const navigate = useNavigate();
  const create = useCreateBudget();
  return (
    <>
      <PageHeader title="New budget" description="Start with the basics. You'll add categories and items next." />
      <div className="max-w-xl rounded-xl border bg-card p-6">
        <BudgetBasicsForm
          submitLabel="Create budget"
          onCancel={() => void navigate({ to: '/budgets' })}
          onSubmit={async (values) => {
            const budget = await create.mutateAsync({ ...values, mode: 'LITE' });
            toast.success('Budget created');
            await navigate({ to: '/budgets/$budgetId', params: { budgetId: budget.id } });
          }}
        />
      </div>
    </>
  );
}
