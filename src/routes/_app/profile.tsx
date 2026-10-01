import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfileForm } from '@/features/profile/ProfileForm';
import { api, type Theme } from '@/lib/api';
import { options, themeLabels } from '@/lib/labels';
import { meQuery } from '@/lib/session';
import { useThemeStore } from '@/stores/theme';

export const Route = createFileRoute('/_app/profile')({ component: ProfilePage });

function ProfilePage() {
  const { me } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const saveTheme = useMutation({
    mutationFn: (theme: Theme) => api.patch('/me/preferences', { theme }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: meQuery.queryKey }),
  });

  return (
    <>
      <PageHeader title="Profile" description="Your details, avatar and appearance." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="details" className="rounded-xl border bg-card p-6">
          <h2 id="details" className="sr-only">
            Profile details
          </h2>
          {me.profile && (
            <ProfileForm
              initial={me.profile}
              submitLabel="Save changes"
              onSaved={(updated) => {
                queryClient.setQueryData(meQuery.queryKey, updated);
                toast.success('Profile updated');
              }}
            />
          )}
        </section>
        <section aria-labelledby="appearance" className="h-fit rounded-xl border bg-card p-6">
          <h2 id="appearance" className="text-lg font-semibold">
            Appearance
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={preference}
              onValueChange={(v) => {
                setPreference(v as Theme);
                saveTheme.mutate(v as Theme);
              }}
            >
              <SelectTrigger id="theme" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options(themeLabels).map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>
      </div>
    </>
  );
}
