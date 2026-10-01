import { Outlet, createRootRouteWithContext, Link, useRouter } from '@tanstack/react-router';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import type { RouterContext } from '@/lib/guards';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: RootError,
  notFoundComponent: NotFound,
});

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      {children}
    </main>
  );
}

/** Friendly fallback — never shows raw error text (FR-049). */
export function RootError() {
  const router = useRouter();
  return (
    <Shell title="Something went wrong">
      <p className="max-w-md text-muted-foreground">
        We hit an unexpected problem loading this page. Your data is safe. Please try again.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => void router.invalidate()}>Try again</Button>
        <Button variant="outline" asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </Shell>
  );
}

/** Shown while route guards load the session, so the page is never blank. */
export function RoutePending() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50dvh] items-center justify-center">
      <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function NotFound() {
  return (
    <Shell title="Page not found">
      <p className="max-w-md text-muted-foreground">The page you're looking for doesn't exist or was moved.</p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </Shell>
  );
}
