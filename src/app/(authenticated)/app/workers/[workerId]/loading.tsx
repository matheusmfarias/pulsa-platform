import { ContentContainer, PageShell } from "@/components/layout/page";

function Bone({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`max-w-full animate-pulse rounded-control bg-subtle motion-reduce:animate-none ${className}`}
    />
  );
}

export default function WorkerDetailLoading() {
  return (
    <PageShell>
      <ContentContainer className="mx-auto max-w-5xl" size="detail-wide">
        <div aria-busy="true" aria-label="Carregando dados do colaborador" role="status">
          <span className="sr-only">Carregando dados do colaborador…</span>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <Bone className="mb-2 h-4 w-52" />
              <Bone className="h-9 w-72" />
              <div className="mt-3 flex items-center gap-3">
                <Bone className="h-6 w-14 rounded-pill" />
                <Bone className="h-4 w-48" />
              </div>
            </div>
            <Bone className="h-10 w-24" />
          </header>

          <div className="mt-8 rounded-card bg-surface px-5 shadow-card sm:px-7">
            <div className="flex h-12 items-center gap-6 border-b border-border-default">
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-16" />
            </div>

            <section className="py-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Bone className="h-5 w-36" />
                <Bone className="h-9 w-32" />
              </div>
              <div className="mt-5">
                <Bone className="h-7 w-64" />
                <Bone className="mt-3 h-4 w-44" />
                <div className="mt-6 grid gap-5 border-t border-border-default pt-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((item) => (
                    <div className="space-y-2" key={item}>
                      <Bone className="h-3 w-20" />
                      <Bone className="h-4 w-36" />
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-5 border-t border-border-default pt-4">
                  <Bone className="h-4 w-40" />
                  <Bone className="h-4 w-20" />
                </div>
              </div>
            </section>

            <section className="border-t border-border-default py-6">
              <Bone className="h-5 w-48" />
              <Bone className="mt-5 h-4 w-72" />
            </section>
          </div>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
