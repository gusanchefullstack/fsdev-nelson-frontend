import { Table2, BarChart3 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  title: string;
  description?: ReactNode;
  chart: ReactNode;
  table: ReactNode;
  actions?: ReactNode;
}

/** Card with a chart and an equivalent data table the user can switch to (accessibility). */
export function ChartFrame({ title, description, chart, table, actions }: Props) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="rounded-xl border bg-card p-5" aria-label={title}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Button variant="outline" size="sm" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
            {asTable ? <BarChart3 aria-hidden /> : <Table2 aria-hidden />} {asTable ? 'Show chart' : 'Show table'}
          </Button>
        </div>
      </div>
      {asTable ? <div className="overflow-x-auto">{table}</div> : <div aria-hidden>{chart}</div>}
      {/* Screen readers always get the table */}
      {!asTable && <div className="sr-only">{table}</div>}
    </section>
  );
}
