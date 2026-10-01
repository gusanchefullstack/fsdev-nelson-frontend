import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { EmptyState } from '@/components/EmptyState';
import { Money } from '@/components/Money';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api';
import { countryName } from '@/lib/geo';
import { sourceQuery, sourcesQuery, useDeleteSource, useSaveSource } from './api';
import { SOURCES, type SourceKind } from './config';
import { SourceForm } from './SourceForm';

export function SourceListPage({ kind }: { kind: SourceKind }) {
  const config = SOURCES[kind];
  const { data, isPending } = useQuery(sourcesQuery(kind));
  const Icon = config.icon;
  const addButton = (
    <Button asChild>
      <Link to={`/${kind}/new`}>
        <Plus aria-hidden /> Add {config.singular}
      </Link>
    </Button>
  );
  return (
    <>
      <PageHeader title={config.title} description={config.description} actions={addButton} />
      {isPending ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : !data?.length ? (
        <EmptyState icon={<Icon />} title={`No ${config.title.toLowerCase()} yet`} description={config.description} action={addButton} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((s) => (
            <li key={s.id}>
              <Link to={`/${kind}/$id`} params={{ id: s.id }} className="flex h-full items-start justify-between gap-3 rounded-xl border bg-card p-4 transition hover:border-primary">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{s.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {config.typeLabels[s.type]}
                    {s.city && ` · ${s.city}`}
                    {s.country && `, ${countryName(s.country)}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {config.hasBalance && s.currentBalance !== undefined ? (
                    <Money amount={s.currentBalance} currency={s.currency} highlightNegative className="font-semibold" />
                  ) : (
                    <Badge variant="outline">{s.currency}</Badge>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function BackLink({ kind }: { kind: SourceKind }) {
  return (
    <Link to={`/${kind}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ChevronLeft className="size-4" aria-hidden /> All {SOURCES[kind].title.toLowerCase()}
    </Link>
  );
}

export function SourceNewPage({ kind }: { kind: SourceKind }) {
  const config = SOURCES[kind];
  const save = useSaveSource(kind);
  const navigate = useNavigate();
  return (
    <>
      <BackLink kind={kind} />
      <PageHeader title={`New ${config.singular}`} description={config.description} />
      <div className="max-w-2xl rounded-xl border bg-card p-6">
        <SourceForm
          config={config}
          submitLabel={`Save ${config.singular}`}
          onCancel={() => void navigate({ to: `/${kind}` })}
          onSubmit={async (body) => {
            await save.mutateAsync({ body });
            toast.success(`${config.singular[0]!.toUpperCase()}${config.singular.slice(1)} added`);
            await navigate({ to: `/${kind}` });
          }}
        />
      </div>
    </>
  );
}

export function SourceDetailPage({ kind, id }: { kind: SourceKind; id: string }) {
  const config = SOURCES[kind];
  const { data, isPending } = useQuery(sourceQuery(kind, id));
  const save = useSaveSource(kind);
  const remove = useDeleteSource(kind);
  const navigate = useNavigate();
  if (isPending || !data) return <Skeleton className="h-96 rounded-xl" />;
  return (
    <>
      <BackLink kind={kind} />
      <PageHeader
        title={data.name}
        eyebrow={
          <>
            <Badge variant="outline">{config.typeLabels[data.type]}</Badge>
            <Badge variant="outline">{data.currency}</Badge>
          </>
        }
        description={
          config.hasBalance && data.currentBalance !== undefined ? (
            <>
              Current balance: <Money amount={data.currentBalance} currency={data.currency} highlightNegative className="font-semibold text-foreground" />
            </>
          ) : undefined
        }
        actions={
          <ConfirmDeleteDialog
            trigger={
              <Button variant="outline">
                <Trash2 aria-hidden /> Delete
              </Button>
            }
            title={`Delete ${data.name}?`}
            description={data.inUse ? `This ${config.singular} has transactions, so it can't be deleted.` : 'This cannot be undone.'}
            pending={remove.isPending}
            onConfirm={async () => {
              try {
                await remove.mutateAsync(id);
                toast.success(`${data.name} deleted`);
                await navigate({ to: `/${kind}` });
              } catch (e) {
                toast.error(isApiError(e) ? e.message : 'Could not delete. Please try again.');
              }
            }}
          />
        }
      />
      <div className="max-w-2xl rounded-xl border bg-card p-6">
        <SourceForm
          config={config}
          initial={data}
          currencyLocked={kind === 'accounts' && data.inUse}
          submitLabel="Save changes"
          onSubmit={async (body) => {
            await save.mutateAsync({ id, body });
            toast.success('Changes saved');
          }}
        />
      </div>
    </>
  );
}
