import { createFileRoute } from '@tanstack/react-router';
import { SourceDetailPage } from '@/features/sources/pages';

export const Route = createFileRoute('/_app/accounts/$id')({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  return <SourceDetailPage kind="accounts" id={id} />;
}
