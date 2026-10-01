import { createFileRoute } from '@tanstack/react-router';
import { SourceListPage } from '@/features/sources/pages';

export const Route = createFileRoute('/_app/accounts/')({ component: () => <SourceListPage kind="accounts" /> });
