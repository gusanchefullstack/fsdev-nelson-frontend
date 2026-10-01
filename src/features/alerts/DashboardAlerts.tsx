import { TriangleAlert } from 'lucide-react';
import type { Dashboard } from '@/features/dashboard/api';
import { AlertItem } from './AlertItem';

/** Unread alerts at the top of the dashboard (FR-035). */
export function DashboardAlerts({ alerts }: { alerts: Dashboard['unreadAlerts'] }) {
  if (!alerts.length) return null;
  return (
    <section aria-labelledby="alerts-h" className="mb-8 rounded-xl border border-warning/40 bg-warning-soft">
      <h2 id="alerts-h" className="flex items-center gap-2 px-4 pt-4 font-semibold">
        <TriangleAlert className="size-5 text-warning" aria-hidden /> Needs your attention
      </h2>
      <ul className="divide-y divide-warning/20">
        {alerts.slice(0, 5).map((a) => (
          <AlertItem key={a.id} alert={a} />
        ))}
      </ul>
    </section>
  );
}
