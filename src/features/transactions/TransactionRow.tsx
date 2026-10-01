import { Link } from '@tanstack/react-router';
import { Money } from '@/components/Money';
import { formatDate, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Transaction } from './api';

export function TransactionRow({ t }: { t: Transaction }) {
  const income = t.kind === 'INCOME';
  return (
    <li>
      <Link to="/transactions/$id" params={{ id: t.id }} className="flex items-center gap-4 px-4 py-3 transition hover:bg-surface-hover">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{t.itemName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {t.origin.name} → {t.destination.name}
          </p>
        </div>
        <div className="text-right">
          <p className={cn('font-semibold', income ? 'text-primary' : '')}>
            <span className="sr-only">{income ? 'Income' : 'Expense'} </span>
            <Money amount={income ? t.amount : `-${t.amount}`} currency={t.currency} signed={income} />
          </p>
          <p className="text-xs text-muted-foreground" title={formatDateTime(t.occurredAt, t.timeZone)}>
            {formatDate(t.localDate)}
          </p>
        </div>
      </Link>
    </li>
  );
}
