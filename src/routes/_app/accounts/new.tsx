import { createFileRoute } from '@tanstack/react-router';
import { SourceNewPage } from '@/features/sources/pages';

export const Route = createFileRoute('/_app/accounts/new')({ component: () => <SourceNewPage kind="accounts" /> });
