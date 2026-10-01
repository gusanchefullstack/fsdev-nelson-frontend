import { createFileRoute, redirect } from '@tanstack/react-router';
import { budgetsQuery } from '@/features/budgets/api';

/** "Reports" in the main menu opens the active budget's reports, or the budget list. */
export const Route = createFileRoute('/_app/reports/')({
  beforeLoad: async ({ context }) => {
    const budgets = await context.queryClient.ensureQueryData(budgetsQuery);
    const target = budgets.find((b) => b.isActive) ?? budgets[0];
    throw target ? redirect({ to: '/budgets/$budgetId/reports', params: { budgetId: target.id } }) : redirect({ to: '/budgets' });
  },
});
