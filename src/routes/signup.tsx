import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { authClient } from '@/lib/auth-client';
import { publicOnly } from '@/lib/guards';
import { meQuery } from '@/lib/session';

export const Route = createFileRoute('/signup')({
  beforeLoad: publicOnly,
  component: SignUpPage,
});

const schema = z.object({
  email: z.email('Enter a valid email address'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Use at least 3 characters')
    .max(30, 'Use 30 characters or fewer')
    .regex(/^[a-z0-9_.]+$/, 'Use only letters, numbers, dots and underscores'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
});
type Values = z.infer<typeof schema>;

function SignUpPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', username: '', password: '' } });

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await authClient.signUp.email({ ...values, name: values.username });
    if (error) {
      const msg = error.message ?? 'We could not create your account. Please try again.';
      const field = /username/i.test(msg) ? 'username' : /email/i.test(msg) ? 'email' : /password/i.test(msg) ? 'password' : null;
      if (field) form.setError(field, { message: msg });
      else form.setError('root', { message: msg });
      return;
    }
    await queryClient.fetchQuery({ ...meQuery, staleTime: 0 });
    await navigate({ to: '/onboarding/profile' });
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start planning every dollar."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input autoComplete="username" {...field} />
                </FormControl>
                <FormDescription>3–30 characters: letters, numbers, dots and underscores.</FormDescription>
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
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>At least 8 characters with a letter and a number.</FormDescription>
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
            {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
