import { createFileRoute } from '@tanstack/react-router';
import { ComingSoon } from '@/components/ComingSoon';

// Built in US7
export const Route = createFileRoute('/_app/budgets/$budgetId/reports')({ component: () => <ComingSoon title="Reports" /> });
