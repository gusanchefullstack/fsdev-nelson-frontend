import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  Download,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  UserRound,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NotificationSlot } from '@/features/alerts/NotificationSlot';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { requireApp } from '@/lib/guards';
import { meQuery } from '@/lib/session';

export const Route = createFileRoute('/_app')({
  beforeLoad: requireApp,
  component: AppLayout,
});

const NAV: { to: '/dashboard' | '/budgets' | '/accounts' | '/payors' | '/vendors' | '/transactions' | '/reports'; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/budgets', label: 'Budgets', icon: PieChart },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/payors', label: 'Payors', icon: Download },
  { to: '/vendors', label: 'Vendors', icon: Building2 },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <Link
            to={to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            activeProps={{ className: 'bg-surface-hover text-foreground font-medium', 'aria-current': 'page' }}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AppLayout() {
  const { me } = Route.useRouteContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saveTheme = useMutation({ mutationFn: (theme: 'LIGHT' | 'DARK') => api.patch('/me/preferences', { theme }) });

  const logout = async () => {
    await authClient.signOut();
    queryClient.clear();
    queryClient.setQueryData(meQuery.queryKey, null);
    await navigate({ to: '/' });
  };

  const initials = `${me.profile?.firstName?.[0] ?? ''}${me.profile?.lastName?.[0] ?? ''}`.toUpperCase() || 'N';

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[var(--sidebar-width)_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>

      <aside className="hidden border-r bg-background-deep p-4 lg:flex lg:flex-col lg:gap-6" aria-label="Sidebar">
        <Link to="/dashboard" className="px-2 py-1">
          <Logo />
        </Link>
        <nav aria-label="Main">
          <p className="label-caps mb-2 px-3">Menu</p>
          <NavLinks />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background-deep p-4">
              <SheetHeader className="p-0">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Main" className="mt-4">
                <NavLinks onNavigate={() => setMenuOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/dashboard" className="lg:hidden">
            <Logo withText={false} />
            <span className="sr-only">Nelson home</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <NotificationSlot />
            <ThemeToggle onChange={(t) => saveTheme.mutate(t)} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 rounded-full px-1 sm:pr-3" aria-label="Account menu">
                  <img src={me.profile?.avatarUrl} alt="" className="size-8 rounded-full bg-muted object-cover" />
                  <span className="hidden text-sm sm:inline">{me.profile?.firstName ?? initials}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium">
                    {me.profile?.firstName} {me.profile?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">@{me.username}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserRound aria-hidden /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void logout()}>
                  <LogOut aria-hidden /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[var(--content-max)] flex-1 p-4 outline-none sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
