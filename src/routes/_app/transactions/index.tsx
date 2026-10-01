import { createFileRoute } from '@tanstack/react-router';
import { ComingSoon } from '@/components/ComingSoon';

export const Route = createFileRoute('/_app/transactions/')({ component: () => <ComingSoon title="Transactions" /> });
