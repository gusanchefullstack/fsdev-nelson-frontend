// Recharts accepts CSS variables in SVG attributes, so charts follow the theme tokens
export const chart = {
  grid: 'var(--chart-grid)',
  axis: 'var(--muted-foreground)',
  income: 'var(--chart-1)',
  incomePlan: 'var(--chart-4)',
  expense: 'var(--chart-2)',
  expensePlan: 'var(--chart-6)',
  warn: 'var(--chart-3)',
  tooltip: {
    contentStyle: { background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--popover-foreground)' },
    labelStyle: { color: 'var(--popover-foreground)' },
    itemStyle: { color: 'var(--popover-foreground)' },
  },
  tick: { fill: 'var(--muted-foreground)', fontSize: 12 },
} as const;
