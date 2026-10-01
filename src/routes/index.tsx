import { Link, createFileRoute } from '@tanstack/react-router';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { publicOnly } from '@/lib/guards';

// Full hummingbird landing is built in US9
export const Route = createFileRoute('/')({
  beforeLoad: publicOnly,
  component: Landing,
});

function Landing() {
  return (
    <div className="bg-hero flex min-h-dvh flex-col">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Logo />
        <ThemeToggle />
      </header>
      <main id="main" className="flex flex-1 flex-col items-start justify-center gap-6 px-6 sm:px-12">
        <h1 className="font-display text-[length:var(--text-hero)] font-semibold leading-tight tracking-tight">
          Every dollar, <span className="text-primary">on the wing.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Plan your budget, track every transaction against its bucket and see where your money is heading.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link to="/signup">Sign up</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
