import { Construction } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';

/** Temporary page for sections built in later user stories. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={<Construction />} title="Coming soon" description="This section is being built." />
    </>
  );
}
