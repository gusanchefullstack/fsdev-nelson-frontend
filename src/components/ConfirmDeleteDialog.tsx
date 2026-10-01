import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { api, type Schemas } from '@/lib/api';

interface Props {
  trigger: ReactNode;
  title: string;
  description?: string;
  /** e.g. "/budgets/123/deletion-impact" — lists what else will be removed (FR-020) */
  impactPath?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  pending?: boolean;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function ConfirmDeleteDialog({ trigger, title, description, impactPath, confirmLabel = 'Delete', onConfirm, pending }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description ?? 'This cannot be undone.'}</AlertDialogDescription>
        </AlertDialogHeader>
        {impactPath && <Impact path={impactPath} />}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Impact({ path }: { path: string }) {
  const { data, isPending } = useQuery({
    queryKey: ['deletion-impact', path],
    queryFn: () => api.get<Schemas['DeletionImpact']>(path),
  });
  if (isPending) return <p className="text-sm text-muted-foreground">Checking what will be removed…</p>;
  if (!data) return null;
  const parts = [
    data.categories ? plural(data.categories, 'category') : null,
    data.items ? plural(data.items, 'item') : null,
    data.buckets ? plural(data.buckets, 'bucket') : null,
    plural(data.transactions ?? 0, 'transaction'),
  ].filter(Boolean);
  return (
    <div className="rounded-md bg-destructive-soft p-3 text-sm">
      <p className="font-medium">This will also delete:</p>
      <ul className="mt-1 list-inside list-disc">
        {parts.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {(data.transactions ?? 0) > 0 && <p className="mt-2">Account balances will be restored.</p>}
    </div>
  );
}
