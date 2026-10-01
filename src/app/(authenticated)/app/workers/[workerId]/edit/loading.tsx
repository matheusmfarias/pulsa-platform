import { ContentContainer, PageShell } from "@/components/layout/page";

function Bone({ className }: { className: string }) {
  return <div aria-hidden="true" className={`max-w-full animate-pulse rounded-control bg-subtle motion-reduce:animate-none ${className}`} />;
}

function Fields({ firstWide = false }: { firstWide?: boolean }) {
  return (
    <div className={`mt-4 grid gap-5 ${firstWide ? "sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : "sm:grid-cols-2"}`}>
      {[0, 1].map((field) => (
        <div key={field}>
          <Bone className="h-4 w-24" />
          <Bone className="mt-2 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function EditWorkerLoading() {
  return (
    <PageShell className="sm:py-7">
      <ContentContainer className="max-w-4xl" size="form">
        <div aria-busy="true" aria-label="Carregando dados do colaborador" role="status">
          <span className="sr-only">Carregando dados do colaborador…</span>
          <Bone className="h-4 w-64" />
          <Bone className="mt-3 h-9 w-64" />
          <Bone className="mt-2 h-4 w-48" />
          <div className="mt-5 rounded-card bg-surface p-5 shadow-card sm:p-6">
            <section>
              <Bone className="h-5 w-28" />
              <Fields firstWide />
            </section>
            {["Contato", "Vínculo"].map((section) => (
              <section className="mt-5 border-t border-border-default pt-5" key={section}>
                <Bone className="h-5 w-24" />
                <Fields />
              </section>
            ))}
            <div className="mt-4 flex justify-end gap-2 border-t border-border-default pt-4">
              <Bone className="h-11 w-24" />
              <Bone className="h-11 w-36" />
            </div>
          </div>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
