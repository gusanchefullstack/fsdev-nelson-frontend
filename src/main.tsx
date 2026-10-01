import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { isApiError } from '@/lib/api';
import { meQuery } from '@/lib/session';
import '@/lib/temporal';
import { initTheme } from '@/stores/theme';
import { routeTree } from './routeTree.gen';
import './styles/index.css';

initTheme();

// Session expired while using the app: back to login, then return here
function onAuthError(error: unknown) {
  if (isApiError(error) && error.status === 401 && router.state.location.pathname !== '/login') {
    queryClient.setQueryData(meQuery.queryKey, null);
    void router.navigate({ to: '/login', search: { redirect: router.state.location.href } });
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onAuthError }),
  mutationCache: new MutationCache({ onError: onAuthError }),
  defaultOptions: {
    queries: { retry: (count, error) => !(isApiError(error) && error.status < 500) && count < 2, staleTime: 15_000 },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
);
