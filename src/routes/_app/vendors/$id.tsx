import { createFileRoute } from '@tanstack/react-router';
import { SourceDetailPage } from '@/features/sources/pages';

export const Route = createFileRoute('/_app/vendors/$id')({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  return <SourceDetailPage kind="vendors" id={id} />;
}
