import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { PageHeader } from '@/components/PageHeader';
import { useSaveTransaction } from '@/features/transactions/api';
import { TransactionForm } from '@/features/transactions/TransactionForm';

export const Route = createFileRoute('/_app/transactions/new')({
  validateSearch: z.object({ budgetId: z.string().optional(), itemId: z.string().optional(), kind: z.enum(['INCOME', 'EXPENSE']).optional() }),
  component: NewTransaction,
});

function NewTransaction() {
  const { me } = Route.useRouteContext();
  const defaults = Route.useSearch();
  const save = useSaveTransaction();
  const navigate = useNavigate();
  const router = useRouter();
  return (
    <>
      <PageHeader title="Record transaction" description="Income goes from a payor into an account; expenses go from an account to a vendor." />
      <div className="max-w-2xl rounded-xl border bg-card p-6">
        <TransactionForm
          profileTimeZone={me.profile!.timeZone}
          defaults={defaults}
          submitLabel="Save transaction"
          onCancel={() => router.history.back()}
          onSubmit={async (body) => {
            await save.mutateAsync({ body });
            toast.success('Transaction recorded');
            await navigate({ to: '/transactions' });
          }}
        />
      </div>
    </>
  );
}
