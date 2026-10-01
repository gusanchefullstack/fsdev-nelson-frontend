import { createFileRoute } from '@tanstack/react-router';
import { SourceListPage } from '@/features/sources/pages';

export const Route = createFileRoute('/_app/payors/')({ component: () => <SourceListPage kind="payors" /> });
