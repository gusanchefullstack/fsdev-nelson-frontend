import { queryOptions } from '@tanstack/react-query';
import { api, isApiError, type Schemas } from './api';

export type Me = Schemas['Me'];

/** Current user, or null when logged out. */
export const meQuery = queryOptions({
  queryKey: ['me'],
  queryFn: async (): Promise<Me | null> => {
    try {
      return await api.get<Me>('/me');
    } catch (e) {
      if (isApiError(e) && e.status === 401) return null;
      throw e;
    }
  },
  staleTime: 60_000,
});
