import { usernameClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// Same origin: /api/auth is proxied by Vite in dev and rewritten by Vercel in production
export const authClient = createAuthClient({ plugins: [usernameClient()] });
