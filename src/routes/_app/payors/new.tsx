import { createFileRoute } from '@tanstack/react-router';
import { SourceNewPage } from '@/features/sources/pages';

export const Route = createFileRoute('/_app/payors/new')({ component: () => <SourceNewPage kind="payors" /> });
