import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { ProfileForm } from '@/features/profile/ProfileForm';
import { requireAuth } from '@/lib/guards';
import { meQuery } from '@/lib/session';

export const Route = createFileRoute('/onboarding/profile')({
  beforeLoad: requireAuth,
  component: OnboardingProfile,
});

function OnboardingProfile() {
  const { me } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <div className="bg-hero min-h-dvh">
      <header className="p-4 sm:p-6">
        <Logo />
      </header>
      <main id="main" className="mx-auto max-w-2xl px-4 pb-16">
        <p className="label-caps">Step 1 of 1</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Complete your profile</h1>
        <p className="mt-2 text-muted-foreground">We need a few details before you start. All fields are required.</p>
        <div className="mt-8 rounded-xl border bg-card p-6 sm:p-8">
          <ProfileForm
            initial={{ username: me.username ?? '' }}
            submitLabel="Save and continue"
            onSaved={async (updated) => {
              queryClient.setQueryData(meQuery.queryKey, updated);
              toast.success('Profile saved. Welcome to Nelson!');
              await navigate({ to: '/dashboard' });
            }}
          />
        </div>
      </main>
    </div>
  );
}
