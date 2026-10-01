import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { transactionQuery, useDeleteTransaction, useSaveTransaction } from '@/features/transactions/api';
import { TransactionForm } from '@/features/transactions/TransactionForm';
import { formatDateTime } from '@/lib/format';

export const Route = createFileRoute('/_app/transactions/$id')({ component: EditTransaction });

function EditTransaction() {
  const { id } = Route.useParams();
  const { me } = Route.useRouteContext();
  const { data, isPending } = useQuery(transactionQuery(id));
  const save = useSaveTransaction();
  const remove = useDeleteTransaction();
  const navigate = useNavigate();
  const router = useRouter();
  if (isPending || !data) return <Skeleton className="h-96 rounded-xl" />;
  return (
    <>
      <PageHeader
        title={data.itemName}
        description={`Recorded ${formatDateTime(data.occurredAt, data.timeZone)}`}
        actions={
          <ConfirmDeleteDialog
            trigger={
              <Button variant="outline">
                <Trash2 aria-hidden /> Delete
              </Button>
            }
            title="Delete this transaction?"
            description="Its bucket and account balance will be updated."
            pending={remove.isPending}
            onConfirm={async () => {
              await remove.mutateAsync(id);
              toast.success('Transaction deleted');
              await navigate({ to: '/transactions' });
            }}
          />
        }
      />
      <div className="max-w-2xl rounded-xl border bg-card p-6">
        <TransactionForm
          profileTimeZone={me.profile!.timeZone}
          initial={data}
          submitLabel="Save changes"
          onCancel={() => router.history.back()}
          onSubmit={async (body) => {
            await save.mutateAsync({ id, body });
            toast.success('Transaction updated');
          }}
        />
      </div>
    </>
  );
}
