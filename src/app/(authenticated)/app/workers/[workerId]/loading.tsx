import { ContentContainer, PageShell } from "@/components/layout/page";

function Skeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={"animate-pulse rounded-control bg-subtle " + className}
    />
  );
}

export default function WorkerDetailLoading() {
  return (
    <PageShell>
      <ContentContainer size="detail-wide">
        <div aria-busy="true" aria-label="Carregando detalhe do colaborador">
          <Skeleton className="h-9 w-48" />
          <div className="mt-6 flex items-end justify-between gap-6">
            <div className="w-full max-w-md">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-8 w-72 max-w-full" />
              <Skeleton className="mt-3 h-5 w-48" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="mt-8 divide-y divide-border-default border-y border-border-default">
            {Array.from({ length: 3 }).map((_, section) => (
              <div className="py-6" key={section}>
                <Skeleton className="h-5 w-44" />
                <Skeleton className="mt-3 h-4 w-96 max-w-full" />
                <div className="mt-6 grid gap-5 sm:grid-cols-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
