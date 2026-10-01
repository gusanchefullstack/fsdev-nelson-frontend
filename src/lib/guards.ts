import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { useThemeStore } from '@/stores/theme';
import { meQuery } from './session';

export interface RouterContext {
  queryClient: QueryClient;
}

interface GuardArgs {
  context: RouterContext;
  location: { href: string };
}

async function loadMe(queryClient: QueryClient) {
  const me = await queryClient.ensureQueryData(meQuery);
  // An explicit server-stored theme wins (FR-045); "match device" keeps the visitor's local choice
  if (me && me.theme && me.theme !== 'SYSTEM' && me.theme !== useThemeStore.getState().preference) {
    useThemeStore.getState().setPreference(me.theme);
  }
  return me;
}

/** Logged-out pages: logged-in users go to the dashboard. */
export async function publicOnly({ context }: GuardArgs): Promise<void> {
  const me = await loadMe(context.queryClient);
  if (me) throw redirect({ to: me.profile ? '/dashboard' : '/onboarding/profile' });
}

/** Logged in, profile may be incomplete. */
export async function requireAuth({ context, location }: GuardArgs) {
  const me = await loadMe(context.queryClient);
  if (!me) throw redirect({ to: '/login', search: { redirect: location.href } });
  return { me };
}

/** Logged in with a completed profile (FR-003). */
export async function requireApp({ context, location }: GuardArgs) {
  const me = await loadMe(context.queryClient);
  if (!me) throw redirect({ to: '/login', search: { redirect: location.href } });
  if (!me.profile) throw redirect({ to: '/onboarding/profile' });
  return { me };
}
