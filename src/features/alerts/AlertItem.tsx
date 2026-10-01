import { Link } from '@tanstack/react-router';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUpdateAlert, type Alert } from './api';

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** One alert with read/dismiss actions (FR-043). */
export function AlertItem({ alert, onNavigate }: { alert: Alert; onNavigate?: () => void }) {
  const update = useUpdateAlert();
  const over = alert.type.endsWith('OVER');
  return (
    <li className={cn('flex gap-3 px-4 py-3', alert.read && 'opacity-70')}>
      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', alert.cleared ? 'bg-muted-foreground' : over ? 'bg-warning' : 'bg-info')} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {!alert.read && <span className="sr-only">Unread: </span>}
          {alert.itemId ? (
            <Link to="/budgets/$budgetId/items/$itemId" params={{ budgetId: alert.budgetId, itemId: alert.itemId }} onClick={onNavigate} className="underline-offset-4 hover:underline">
              {alert.message}
            </Link>
          ) : (
            <Link to="/budgets/$budgetId" params={{ budgetId: alert.budgetId }} onClick={onNavigate} className="underline-offset-4 hover:underline">
              {alert.message}
            </Link>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {alert.budgetName} · {when(alert.createdAt)}
          {alert.cleared && ' · back within threshold'}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        {!alert.read && (
          <Button variant="ghost" size="icon-sm" aria-label="Mark as read" onClick={() => update.mutate({ id: alert.id, read: true })}>
            <Check aria-hidden />
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={() => update.mutate({ id: alert.id, dismissed: true })}>
          <X aria-hidden />
        </Button>
      </div>
    </li>
  );
}
