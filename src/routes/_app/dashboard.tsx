import { Link, createFileRoute } from '@tanstack/react-router';
import { PieChart } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

// Replaced by the real dashboard in US6
export const Route = createFileRoute('/_app/dashboard')({ component: Dashboard });

function Dashboard() {
  const { me } = Route.useRouteContext();
  return (
    <>
      <PageHeader title={`Hello, ${me.profile?.firstName ?? 'there'}`} description="Here's where your money stands." />
      <EmptyState
        icon={<PieChart />}
        title="Create your first budget"
        description="Set a period and currency, then add the income and expenses you expect."
        action={
          <Button asChild>
            <Link to="/budgets">Create a budget</Link>
          </Button>
        }
      />
    </>
  );
}
