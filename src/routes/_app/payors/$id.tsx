import { createFileRoute } from '@tanstack/react-router';
import { SourceDetailPage } from '@/features/sources/pages';

export const Route = createFileRoute('/_app/payors/$id')({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  return <SourceDetailPage kind="payors" id={id} />;
}
