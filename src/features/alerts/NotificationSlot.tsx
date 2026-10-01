import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertItem } from './AlertItem';
import { alertsQuery, useReadAll } from './api';

/** Bell with unread count and the alerts panel (FR-043). */
export function NotificationSlot() {
  const { data } = useQuery(alertsQuery);
  const readAll = useReadAll();
  const [open, setOpen] = useState(false);
  const unread = data?.unreadCount ?? 0;
  return (
    <>
      {/* Announces new alerts to screen readers without moving focus */}
      <span className="sr-only" aria-live="polite">
        {unread > 0 ? `${unread} unread alert${unread === 1 ? '' : 's'}` : ''}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative" aria-label={unread ? `Alerts, ${unread} unread` : 'Alerts'}>
            <Bell aria-hidden />
            {unread > 0 && (
              <span className="tabular absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-warning px-1 text-[0.7rem] font-semibold text-background" aria-hidden>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">Alerts</h2>
            <Button variant="link" size="sm" className="h-auto p-0" disabled={!unread} onClick={() => readAll.mutate()}>
              Mark all read
            </Button>
          </div>
          {!data?.data.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="max-h-[60dvh] divide-y overflow-y-auto" aria-label="Alerts">
              {data.data.map((a) => (
                <AlertItem key={a.id} alert={a} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
