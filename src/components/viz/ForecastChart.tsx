import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ForecastVsActual } from '@/features/reports/api';
import type { Currency } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { chart } from './chartTheme';

const monthLabel = (period: string) => new Date(`${period}-01T00:00:00Z`).toLocaleString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export function toForecastRows(series: ForecastVsActual['series']) {
  const byPeriod = new Map<string, { period: string; label: string; incomeExpected: number; incomeActual: number; expenseExpected: number; expenseActual: number }>();
  for (const s of series) {
    const row = byPeriod.get(s.period) ?? { period: s.period, label: monthLabel(s.period), incomeExpected: 0, incomeActual: 0, expenseExpected: 0, expenseActual: 0 };
    if (s.kind === 'INCOME') {
      row.incomeExpected += Number(s.expected);
      row.incomeActual += Number(s.actual);
    } else {
      row.expenseExpected += Number(s.expected);
      row.expenseActual += Number(s.actual);
    }
    byPeriod.set(s.period, row);
  }
  return [...byPeriod.values()].sort((a, b) => a.period.localeCompare(b.period));
}

export function ForecastChart({ data, currency }: { data: ForecastVsActual; currency: Currency }) {
  const rows = toForecastRows(data.series);
  const fmt = (v: number) => formatMoney(v, currency);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis dataKey="label" tick={chart.tick} stroke={chart.grid} />
        <YAxis tick={chart.tick} stroke={chart.grid} tickFormatter={(v: number) => formatMoney(v, currency).replace(/\.00$/, '')} width={80} />
        <Tooltip formatter={(v) => fmt(Number(v))} {...chart.tooltip} />
        <Legend />
        <Bar dataKey="incomeActual" name="Income (actual)" fill={chart.income} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenseActual" name="Expenses (actual)" fill={chart.expense} radius={[4, 4, 0, 0]} />
        <Line dataKey="incomeExpected" name="Income (expected)" stroke={chart.incomePlan} strokeDasharray="5 4" dot={false} strokeWidth={2} />
        <Line dataKey="expenseExpected" name="Expenses (expected)" stroke={chart.expensePlan} strokeDasharray="5 4" dot={false} strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ForecastTable({ data, currency }: { data: ForecastVsActual; currency: Currency }) {
  const rows = toForecastRows(data.series);
  const fmt = (v: number) => formatMoney(v, currency);
  return (
    <Table>
      <caption className="sr-only">Expected versus actual per month</caption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Month</TableHead>
          <TableHead scope="col" className="text-right">Income expected</TableHead>
          <TableHead scope="col" className="text-right">Income actual</TableHead>
          <TableHead scope="col" className="text-right">Expenses expected</TableHead>
          <TableHead scope="col" className="text-right">Expenses actual</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.period}>
            <TableHead scope="row">{r.label}</TableHead>
            <TableCell className="tabular text-right">{fmt(r.incomeExpected)}</TableCell>
            <TableCell className="tabular text-right">{fmt(r.incomeActual)}</TableCell>
            <TableCell className="tabular text-right">{fmt(r.expenseExpected)}</TableCell>
            <TableCell className="tabular text-right">{fmt(r.expenseActual)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
