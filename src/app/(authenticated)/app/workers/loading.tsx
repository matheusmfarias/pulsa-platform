import { ContentContainer, PageShell } from "@/components/layout/page";

function Skeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={"animate-pulse rounded-control bg-subtle " + className}
    />
  );
}

export default function WorkersLoading() {
  return (
    <PageShell>
      <ContentContainer size="list">
        <div aria-busy="true" aria-label="Carregando colaboradores">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-3 h-8 w-52" />
              <Skeleton className="mt-3 h-4 w-80 max-w-full" />
            </div>
            <Skeleton className="h-10 w-44" />
          </div>

          <div className="mt-6 grid gap-3 rounded-surface border border-border-default bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_12rem_9rem]">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <Skeleton className="mt-5 h-5 w-44" />

          <div className="mt-4 overflow-hidden rounded-surface border border-border-default bg-surface">
            <Skeleton className="h-11 w-full rounded-none" />
            <div className="divide-y divide-border-default">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  className="grid grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr] gap-6 px-4 py-4"
                  key={index}
                >
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
