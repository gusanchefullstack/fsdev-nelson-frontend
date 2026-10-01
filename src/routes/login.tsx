import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { authClient } from '@/lib/auth-client';
import { publicOnly } from '@/lib/guards';
import { meQuery } from '@/lib/session';

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: publicOnly,
  component: LoginPage,
});

const schema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Enter your password'),
});
type Values = z.infer<typeof schema>;

const GENERIC = 'Invalid email/username or password.';

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '' } });

  const onSubmit = form.handleSubmit(async ({ identifier, password }) => {
    const { error } = identifier.includes('@')
      ? await authClient.signIn.email({ email: identifier, password })
      : await authClient.signIn.username({ username: identifier.toLowerCase(), password });
    if (error) {
      // Never reveal which part was wrong (US1 scenario 4)
      form.setError('root', { message: error.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : GENERIC });
      return;
    }
    await queryClient.fetchQuery({ ...meQuery, staleTime: 0 });
    // Only follow same-app redirects
    const target = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard';
    await navigate({ to: target });
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see where your money is going."
      footer={
        <>
          New to Nelson?{' '}
          <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4" noValidate>
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email or username</FormLabel>
                <FormControl>
                  <Input autoComplete="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
