import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="bg-hero flex min-h-dvh flex-col">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Link to="/">
          <Logo />
          <span className="sr-only">Nelson home</span>
        </Link>
        <ThemeToggle />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-md sm:p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
