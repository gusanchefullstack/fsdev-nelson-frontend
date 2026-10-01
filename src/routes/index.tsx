import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight, BarChart3, BellRing, Check, Gauge, Sparkles } from 'lucide-react';
import { Suspense, lazy } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { HummingbirdSvg } from '@/features/landing/HummingbirdSvg';
import { useMotionOk } from '@/features/landing/useMotionOk';
import { publicOnly } from '@/lib/guards';
import { cn } from '@/lib/utils';

const Hummingbird3D = lazy(() => import('@/features/landing/Hummingbird3D'));

export const Route = createFileRoute('/')({
  beforeLoad: publicOnly,
  component: Landing,
});

function Chip({ className, dot, title, subtitle }: { className?: string; dot: string; title: string; subtitle: string }) {
  return (
    <div className={cn('absolute hidden rounded-lg border bg-card/90 px-3 py-2 shadow-md backdrop-blur sm:block', className)} aria-hidden>
      <p className="tabular flex items-center gap-2 text-xs font-semibold">
        <span className={cn('size-2 rounded-full', dot)} />
        {title}
      </p>
      <p className="ml-4 text-[0.7rem] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function HeroVisual() {
  const motionOk = useMotionOk();
  const still = <HummingbirdSvg className="size-full" />;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
      {motionOk ? (
        <Suspense fallback={still}>
          <Hummingbird3D className="size-full" />
        </Suspense>
      ) : (
        still
      )}
      <Chip className="left-0 top-[12%]" dot="bg-bucket-on-target" title="Rent · bucket 7/12" subtitle="Opens Jul 5 · due Jul 20" />
      <Chip className="right-0 top-[45%]" dot="bg-bucket-under" title="+$9,850.00 landed" subtitle="Salary · on target" />
      <Chip className="bottom-[18%] left-[4%]" dot="bg-bucket-over" title="PG&E at 118%" subtitle="Alert sent · threshold 110%" />
    </div>
  );
}

const FEATURES = [
  {
    icon: Gauge,
    title: 'Bucket tracking',
    text: 'Every budget item becomes a row of buckets, one per expected payment. Watch them fill, overflow or wait.',
  },
  {
    icon: BellRing,
    title: 'Threshold alerts',
    text: 'Pick your tolerance. Nelson tells you when spending runs over or income falls short, the moment it happens.',
  },
  {
    icon: BarChart3,
    title: 'Forecast & insights',
    text: 'See where the year lands based on how you are actually doing, and which estimates need a second look.',
  },
];

const STEPS = [
  { title: 'Plan', text: 'Set a period and currency, then add the income and expenses you expect, how much and how often.' },
  { title: 'Record', text: 'Log each paycheck and bill. Nelson drops it into the right bucket automatically.' },
  { title: 'Adjust', text: 'Follow the dashboard, act on alerts and refine estimates with real numbers.' },
];

function Landing() {
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Sections" className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild className="hidden sm:inline-flex">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="bg-hero" aria-labelledby="hero-title">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" aria-hidden /> Personal budgeting, reimagined
              </p>
              <h1 id="hero-title" className="font-display text-[length:var(--text-hero)] font-semibold leading-[1.05] tracking-tight">
                Every dollar, <span className="text-primary">on the wing.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Nelson turns your budget into living buckets that fill as money moves, so you see the moment it happens whether every
                paycheck, bill and subscription lands where you planned.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/signup">
                    Create your budget <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">Log in</Link>
                </Button>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {['USD & COP budgets', 'Bucket-level tracking', 'Light & dark'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="size-4 text-primary" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <HeroVisual />
          </div>
        </section>

        <section id="features" aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="label-caps text-primary">Features</p>
          <h2 id="features-title" className="mt-2 max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for how money actually moves.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Plan once. Nelson tracks every income and expense against the exact window it was expected in.</p>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl border bg-card p-6">
                <span className="inline-flex rounded-lg bg-primary-soft p-2 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="how" aria-labelledby="how-title" className="border-t bg-background-deep">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="how-title" className="font-display text-3xl font-semibold tracking-tight">How it works</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="tabular grid size-9 shrink-0 place-items-center rounded-full border text-primary">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Button asChild size="lg" className="mt-10">
              <Link to="/signup">Get started, it's free</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} Nelson. Plan every dollar.</p>
        </div>
      </footer>
    </div>
  );
}
