import { ContentContainer, PageShell } from "@/components/layout/page";

type SkeletonKind = "collection" | "detail" | "form" | "dashboard" | "schedule" | "worker" | "claim";
type SkeletonScope = "core" | "worker" | "worker-public";

function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-control bg-subtle ${className}`}
    />
  );
}

function CollectionData() {
  return (
    <div className="mt-6 overflow-hidden rounded-surface border border-border-default bg-surface">
      <div className="flex min-h-12 items-center border-b border-border-default px-4 sm:px-5">
        <Bone className="h-4 w-32" />
      </div>
      <div aria-hidden="true" className="hidden min-h-10 grid-cols-4 items-center gap-5 border-b border-border-default bg-subtle/60 px-5 sm:grid">
        <Bone className="h-3 w-20" />
        <Bone className="h-3 w-24" />
        <Bone className="h-3 w-20" />
        <Bone className="h-3 w-16" />
      </div>
      <div className="divide-y divide-border-default/80">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="grid min-h-[4.25rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:grid-cols-4 sm:gap-5 sm:px-5" key={index}>
            <Bone className="h-4 w-3/4" />
            <Bone className="h-4 w-20 sm:w-24" />
            <Bone className="hidden h-4 w-4/5 sm:block" />
            <Bone className="hidden h-5 w-16 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailData() {
  return (
    <div className="mt-6 space-y-5">
      {[0, 1, 2].map((section) => (
        <section className="rounded-surface border border-border-default bg-surface p-5 sm:p-6" key={section}>
          <Bone className="h-4 w-36" />
          <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {[0, 1, 2, 3].map((field) => (
              <div className="space-y-2" key={field}>
                <Bone className="h-3 w-20" />
                <Bone className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FormData() {
  return (
    <section className="mt-6 rounded-surface border border-border-default bg-surface p-5 sm:p-7">
      <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((field) => (
          <div className="space-y-2" key={field}>
            <Bone className="h-3 w-24" />
            <Bone className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-7 flex justify-end gap-3 border-t border-border-default pt-5">
        <Bone className="h-10 w-24" />
        <Bone className="h-10 w-32" />
      </div>
    </section>
  );
}

function DashboardData() {
  return (
    <div className="mt-7 space-y-7">
      <section className="rounded-surface border border-border-default bg-surface p-5 sm:p-6">
        <Bone className="h-5 w-40" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Bone className="h-24 w-full" />
          <Bone className="h-24 w-full" />
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <Bone className="h-28 w-full rounded-surface" key={item} />)}
      </div>
      <Bone className="h-48 w-full rounded-surface" />
    </div>
  );
}

function ScheduleData() {
  return (
    <div className="mt-6 overflow-hidden rounded-surface border border-border-default bg-surface">
      <div className="flex flex-wrap gap-3 border-b border-border-default p-4">
        <Bone className="h-10 w-36" />
        <Bone className="h-10 w-28" />
        <Bone className="h-10 w-32" />
      </div>
      <div className="overflow-hidden p-4">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {Array.from({ length: 16 }, (_, index) => (
            <Bone className={index % 4 === 0 ? "h-16 w-full" : "h-12 w-full"} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkerData({ kind }: { kind: Exclude<SkeletonKind, "dashboard" | "schedule"> }) {
  if (kind === "collection") {
    return (
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4].map((item) => (
          <div className="rounded-surface border border-border-default bg-surface p-4" key={item}>
            <Bone className="h-4 w-36" />
            <Bone className="mt-3 h-4 w-2/3" />
            <Bone className="mt-3 h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "form") return <FormData />;
  return <DetailData />;
}

function ClaimData() {
  return (
    <div className="space-y-5">
      <Bone className="h-7 w-56" />
      <Bone className="h-4 w-full" />
      <section className="rounded-control border border-border-default bg-subtle/40 p-4">
        <Bone className="h-3 w-40" />
        <Bone className="mt-3 h-5 w-3/4" />
        <Bone className="mt-2 h-4 w-2/3" />
      </section>
      <Bone className="h-10 w-full" />
    </div>
  );
}

export function DataRouteSkeleton({
  kind,
  label,
  scope = "core",
}: {
  kind: SkeletonKind;
  label: string;
  scope?: SkeletonScope;
}) {
  const content = kind === "collection"
    ? <CollectionData />
    : kind === "detail"
      ? <DetailData />
      : kind === "form"
        ? <FormData />
        : kind === "dashboard"
          ? <DashboardData />
          : kind === "schedule"
          ? <ScheduleData />
            : kind === "claim"
              ? <ClaimData />
              : <WorkerData kind={kind} />;

  if (scope === "worker-public") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-8 sm:px-6 sm:py-12">
        <section className="w-full rounded-surface border border-border-default bg-surface p-6 sm:p-8">
          <div aria-busy="true" aria-label={label} role="status">
            <span className="sr-only">{label}…</span>
            {content}
          </div>
        </section>
      </main>
    );
  }

  if (scope === "worker") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div aria-busy="true" aria-label={label} role="status">
          <span className="sr-only">{label}…</span>
          {content}
        </div>
      </main>
    );
  }

  return (
    <PageShell className="py-7 sm:py-8">
      <ContentContainer size={kind === "detail" ? "detail" : "list"}>
        <div aria-busy="true" aria-label={label} role="status">
          <span className="sr-only">{label}…</span>
          {content}
        </div>
      </ContentContainer>
    </PageShell>
  );
}

export function createDataRouteLoading(
  kind: SkeletonKind,
  label: string,
  scope: SkeletonScope = "core",
) {
  return function RouteDataLoading() {
    return <DataRouteSkeleton kind={kind} label={label} scope={scope} />;
  };
}
