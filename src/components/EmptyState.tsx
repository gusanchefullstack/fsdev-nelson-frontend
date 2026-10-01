import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      {icon && <div className="mb-4 rounded-full bg-primary-soft p-3 text-primary [&_svg]:size-6">{icon}</div>}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-md text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
