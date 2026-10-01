import { ContentContainer, PageShell } from "@/components/layout/page";
import type { CSSProperties } from "react";

type SkeletonKind = "collection" | "detail" | "form" | "dashboard" | "schedule" | "worker" | "claim";
type SkeletonScope = "core" | "worker" | "worker-public" | "drawer";

function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-control bg-subtle motion-reduce:animate-none ${className}`}
    />
  );
}

function PageHeading({ dashboard = false, action = false }: { dashboard?: boolean; action?: boolean }) {
  return (
    <header className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${dashboard ? "rounded-card bg-surface px-5 py-5 shadow-card sm:px-7 sm:py-6" : ""}`}>
      <div>
        <Bone className="h-3 w-28" />
        <Bone className="mt-3 h-7 w-52 max-w-full" />
        <Bone className="mt-2 h-4 w-72 max-w-full" />
      </div>
      {action ? <Bone className="h-10 w-36" /> : null}
    </header>
  );
}

function CollectionHeader({ label }: { label: string }) {
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
      <div>
        <Bone className="h-4 w-32" />
        <Bone className="mt-1.5 h-3 w-24" />
      </div>
      <Bone className="h-8 w-8 rounded-full" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function ResultSummary() {
  return <div className="flex min-h-12 items-center px-5 py-2.5"><div><Bone className="h-4 w-36" /><Bone className="mt-1.5 h-3 w-24" /></div></div>;
}

function PaginationFooter() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 border-t border-border-default/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex items-center justify-between gap-4 sm:justify-start">
        <Bone className="h-4 w-20" />
        <div className="flex items-center gap-1.5"><Bone className="h-3 w-16" />{[0, 1, 2].map((item) => <Bone className="size-8" key={item} />)}</div>
      </div>
      <div className="flex justify-between gap-2 sm:justify-end"><Bone className="h-9 w-24" /><Bone className="h-9 w-24" /></div>
    </div>
  );
}

function FilterBar({ type = "search" }: { type?: "search" | "chips" | "audit" }) {
  if (type === "chips") {
    return (
      <div className="mt-5 flex flex-wrap gap-2" aria-hidden="true">
        <Bone className="h-8 w-16 rounded-full" />
        <Bone className="h-8 w-28 rounded-full" />
      </div>
    );
  }

  if (type === "audit") {
    return (
      <div className="mt-6 grid gap-3 rounded-card bg-surface p-4 shadow-card sm:grid-cols-2 xl:grid-cols-6" aria-hidden="true">
        <Bone className="h-10 w-full" />
        <Bone className="h-10 w-full" />
        <Bone className="h-10 w-full" />
        <Bone className="h-10 w-full" />
        <Bone className="h-10 w-full" />
        <Bone className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]" aria-hidden="true">
      <Bone className="h-10 w-full" />
      <Bone className="h-10 w-full" />
      <Bone className="h-10 w-full sm:w-24" />
    </div>
  );
}

function TableRows({ columns, rows = 6, compact = false }: { columns: number; rows?: number; compact?: boolean }) {
  const columnStyle = { "--skeleton-columns": `repeat(${columns}, minmax(0, 1fr))` } as CSSProperties;
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-card">
      <div aria-hidden="true" className={`hidden min-h-10 items-center gap-5 bg-subtle/45 px-4 sm:grid sm:px-5`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, index) => <Bone className={`h-3 ${index === 0 ? "w-24" : "w-16"}`} key={index} />)}
      </div>
      <div className="divide-y divide-border-default/70">
        {Array.from({ length: rows }, (_, row) => (
          <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[var(--skeleton-columns)] sm:gap-5 sm:px-5" key={row} style={columnStyle}>
            <div className="min-w-0">
              <Bone className={`h-4 ${row % 2 ? "w-2/3" : "w-4/5"}`} />
              <div className="mt-2 space-y-1.5 sm:hidden">
                <Bone className="h-3 w-3/4" />
                {!compact && <Bone className="h-3 w-1/2" />}
              </div>
            </div>
            <Bone className="h-5 w-16" />
            <div className="hidden min-w-0 sm:contents">
              {Array.from({ length: Math.max(0, columns - 3) }, (_, index) => <Bone className={`h-4 ${index % 2 ? "w-3/4" : "w-4/5"}`} key={index} />)}
              <Bone className="h-4 w-8 justify-self-end" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type CoreCollectionProfile = {
  columns: number;
  filter: "none" | "search" | "coverage" | "audit" | "presence";
  pagination?: boolean;
  mobileAt?: "md" | "xl";
};

function coreCollectionProfile(label: string): CoreCollectionProfile {
  const name = label.toLocaleLowerCase("pt-BR");
  if (name.includes("presença")) return { columns: 7, filter: "presence" };
  if (name.includes("ausência")) return { columns: 8, filter: "coverage" };
  if (name.includes("auditoria")) return { columns: 6, filter: "audit", pagination: true, mobileAt: "md" };
  if (name.includes("usuário")) return { columns: 5, filter: "none", mobileAt: "md" };
  if (name.includes("aloca")) return { columns: 6, filter: "search", pagination: true };
  if (name.includes("posto")) return { columns: 7, filter: "search" };
  if (name.includes("cargo") || name.includes("cliente")) return { columns: 5, filter: "search" };
  if (name.includes("unidade")) return { columns: 8, filter: "none" };
  if (name.includes("opera")) return { columns: 6, filter: "none" };
  return { columns: 5, filter: "none" };
}

function CoreCollectionRows({ columns, mobileAt = "xl" }: Pick<CoreCollectionProfile, "columns" | "mobileAt">) {
  const mobileClass = mobileAt === "md" ? "md:hidden" : "xl:hidden";
  const desktopClass = mobileAt === "md" ? "md:block" : "xl:block";
  return (
    <>
      <div aria-hidden="true" className={`mt-4 grid gap-3 ${mobileClass}`}>
        {[0, 1, 2].map((row) => (
          <div className="rounded-card bg-surface p-4 shadow-card" key={row}>
            <div className="flex items-start justify-between gap-3"><Bone className="h-5 w-3/5" /><Bone className="h-6 w-16 rounded-full" /></div>
            <Bone className="mt-3 h-4 w-4/5" />
            <Bone className="mt-2 h-4 w-2/3" />
            <div className="mt-4 border-t border-border-default pt-3"><Bone className="h-4 w-28" /></div>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className={`mt-4 hidden overflow-hidden rounded-card bg-surface shadow-card ${desktopClass}`}>
        <div className="grid min-h-10 items-center gap-4 bg-subtle/45 px-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, index) => <Bone className={index === 0 ? "h-3 w-20 max-w-full" : "h-3 w-12 max-w-full"} key={index} />)}
        </div>
        <div className="divide-y divide-border-default/70">
          {[0, 1, 2, 3].map((row) => (
            <div className="grid min-h-14 items-center gap-4 px-4 py-2" key={row} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: columns }, (_, column) => <Bone className={`h-4 max-w-full ${column === 0 ? "w-4/5" : column === columns - 1 ? "w-8" : "w-3/4"}`} key={column} />)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CoreCollectionData({ label }: { label: string }) {
  const profile = coreCollectionProfile(label);
  return (
    <div className="mt-5 sm:mt-6">
      {profile.filter === "search" ? (
        <div aria-hidden="true" className="mb-5 flex flex-col gap-3 rounded-card bg-surface p-3 shadow-card sm:flex-row sm:p-4">
          <Bone className="h-10 flex-1" /><Bone className="h-10 w-32 max-w-full" />
        </div>
      ) : profile.filter === "coverage" ? (
        <div aria-hidden="true" className="mb-4 flex gap-2"><Bone className="h-10 w-28" /><Bone className="h-10 w-36" /></div>
      ) : profile.filter === "audit" ? (
        <div aria-hidden="true" className="mb-5 grid gap-3 rounded-card bg-surface p-4 shadow-card sm:grid-cols-2 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((item) => <Bone className="h-10 w-full" key={item} />)}
        </div>
      ) : profile.filter === "presence" ? (
        <>
          <div aria-hidden="true" className="mb-5 flex items-center justify-between rounded-card bg-surface p-4 shadow-card"><Bone className="h-10 w-10" /><Bone className="h-10 w-40" /><Bone className="h-10 w-10" /></div>
          <div aria-hidden="true" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">{[0, 1, 2, 3, 4].map((item) => <div className="rounded-card bg-surface p-4 shadow-card" key={item}><Bone className="h-3 w-20" /><Bone className="mt-2 h-6 w-10" /></div>)}</div>
        </>
      ) : null}
      <Bone className="h-4 w-40" />
      <CoreCollectionRows columns={profile.columns} mobileAt={profile.mobileAt} />
      {profile.pagination ? <div className="mt-3 overflow-hidden rounded-card bg-surface shadow-card"><PaginationFooter /></div> : null}
    </div>
  );
}

function CoreDetailData({ label }: { label: string }) {
  const name = label.toLocaleLowerCase("pt-BR");
  const firstSectionFields = name.includes("cargo") ? 3 : name.includes("registro") ? 5 : 4;
  return (
    <div className="mt-8 divide-y divide-border-default rounded-card bg-surface px-5 shadow-card sm:px-7">
      {[firstSectionFields, 3].map((fields, section) => (
        <section className="py-6" key={section}>
          <Bone className={section === 0 ? "h-5 w-44" : "h-5 w-36"} />
          {section === 0 ? <Bone className="mt-2 h-4 w-72 max-w-full" /> : null}
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: fields }, (_, field) => <div className="space-y-2" key={field}><Bone className="h-3 w-20" /><Bone className="h-4 w-3/4" /></div>)}
          </div>
        </section>
      ))}
    </div>
  );
}

function coreFormSections(label: string): number[] {
  const name = label.toLocaleLowerCase("pt-BR");
  if (name.includes("cliente")) return [3];
  if (name.includes("cargo")) return [2];
  if (name.includes("contrato")) return [2, 2, 1];
  if (name.includes("operação")) return [2, 2, 2];
  if (name.includes("unidade")) return [3, 3, 1];
  if (name.includes("posto")) return [3, 1];
  if (name.includes("alocação")) return [2, 2];
  if (name.includes("escala")) return [2, 3, 1];
  return [2, 2];
}

function CoreFormData({ label }: { label: string }) {
  const sections = coreFormSections(label);
  return (
    <div className="mt-5 rounded-card bg-surface p-5 shadow-card sm:p-6">
      {sections.map((fields, section) => (
        <section className={section > 0 ? "mt-5 border-t border-border-default pt-5" : ""} key={section}>
          <Bone className="h-5 w-36" />
          {sections.length > 1 ? <Bone className="mt-2 h-4 w-64 max-w-full" /> : null}
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {Array.from({ length: fields }, (_, field) => <div key={field}><Bone className="h-4 w-24" /><Bone className="mt-2 h-10 w-full" /></div>)}
          </div>
        </section>
      ))}
      <div className="mt-4 flex justify-end gap-2 border-t border-border-default pt-4"><Bone className="h-11 w-24" /><Bone className="h-11 w-36" /></div>
    </div>
  );
}

function CollectionData({ label }: { label: string }) {
  const normalized = label.toLocaleLowerCase("pt-BR");
  if (normalized.includes("presença")) {
    return (
      <div className="mt-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-card">
          <Bone className="h-10 w-10 rounded-full" />
          <Bone className="h-10 w-40" />
          <Bone className="h-10 w-10 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[0, 1, 2, 3, 4].map((item) => <div className={`rounded-card bg-surface p-4 shadow-card ${item === 4 ? "col-span-2 md:col-span-1" : ""}`} key={item}><Bone className="h-3 w-24 max-w-full" /><Bone className="mt-2 h-6 w-10" /></div>)}
        </div>
        <div><Bone className="h-5 w-48" /><Bone className="mt-2 h-4 w-72 max-w-full" /><div className="mt-4"><TableRows columns={7} compact /></div></div>
      </div>
    );
  }

  if (normalized.includes("auditoria")) {
    return <><FilterBar type="audit" /><div className="mt-5"><Bone className="mb-3 h-4 w-40" /><TableRows columns={6} /><PaginationFooter /></div></>;
  }

  if (normalized.includes("colaborador")) {
    return (
      <section className="mt-6 overflow-hidden rounded-card bg-surface shadow-card">
        <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:p-4"><Bone className="h-10 w-full" /><Bone className="h-10 w-full" /></div>
        <ResultSummary />
        <div className="border-t border-border-default/80"><TableRows columns={6} rows={4} /></div>
      </section>
    );
  }

  if (normalized.includes("ausência")) {
    return <div className="mt-5"><FilterBar type="chips" /><Bone className="mt-4 h-4 w-40" /><div className="mt-3"><TableRows columns={8} /></div></div>;
  }

  if (normalized.includes("escala")) {
    return <div className="mt-5"><CollectionHeader label={label} /><TableRows columns={5} /></div>;
  }

  if (normalized.includes("usuário")) {
    return <div className="mt-6"><CollectionHeader label={label} /><TableRows columns={5} /></div>;
  }

  if (["cliente", "cargo", "posto", "aloc"].some((term) => normalized.includes(term))) {
    const columns = normalized.includes("aloc") ? 6 : normalized.includes("posto") ? 7 : 5;
    return <><FilterBar /><CollectionHeader label={label} /><TableRows columns={columns} /><PaginationFooter /></>;
  }

  const columns = normalized.includes("unidade") ? 8 : normalized.includes("opera") ? 6 : normalized.includes("contrato") ? 5 : 5;
  return <div className="mt-6"><CollectionHeader label={label} /><TableRows columns={columns} /></div>;
}

const detailProfiles: Record<string, number[]> = {
  conta: [1],
  jornada: [3],
  colaborador: [4, 4, 3, 4],
  ausência: [6, 4, 3],
  alocação: [4, 4, 2],
  cliente: [4, 4],
  contrato: [4, 4, 3],
  operação: [4, 4, 4],
  unidade: [4, 5, 4],
  posto: [4, 4, 3],
  cargo: [3, 3],
  usuário: [4, 3],
  registro: [4, 4],
};

function DetailData({ label }: { label: string }) {
  const normalized = label.toLocaleLowerCase("pt-BR");
  const key = Object.keys(detailProfiles).find((profile) => normalized.includes(profile));
  const sections = key ? detailProfiles[key] : [4, 4, 4];
  return (
    <div className="mt-6 overflow-hidden rounded-card bg-surface shadow-card">
      {sections.map((fields, section) => (
        <section className="border-b border-border-default/70 px-5 py-6 last:border-0 sm:px-7" key={section}>
          <Bone className="h-4 w-36" />
          <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: fields }, (_, field) => <div className="space-y-2" key={field}><Bone className="h-3 w-20" /><Bone className="h-5 w-3/4" /></div>)}
          </div>
        </section>
      ))}
      {key === "operação" || key === "unidade" || key === "colaborador" ? <section className="px-5 py-6 sm:px-7"><Bone className="h-4 w-40" /><div className="mt-4"><TableRows columns={5} rows={3} compact /></div></section> : null}
    </div>
  );
}

const formProfiles: Record<string, number[]> = {
  colaborador: [5, 4, 4],
  alocação: [4, 3],
  contrato: [5, 4],
  operação: [4, 3],
  unidade: [5, 3],
  posto: [4, 3],
  cargo: [3],
  escala: [3],
  cliente: [4],
};

function FormData({ label }: { label: string }) {
  const normalized = label.toLocaleLowerCase("pt-BR");
  const key = Object.keys(formProfiles).find((profile) => normalized.includes(profile));
  const sections = key ? formProfiles[key] : [6];
  return (
    <div className="mt-6 space-y-5">
      {sections.map((fields, section) => (
        <section className="rounded-card bg-surface p-5 shadow-card sm:p-7" key={section}>
          {sections.length > 1 ? <><Bone className="h-4 w-40" /><Bone className="mt-2 h-3 w-64 max-w-full" /></> : null}
          <div className={`${sections.length > 1 ? "mt-5" : ""} grid gap-x-6 gap-y-6 sm:grid-cols-2`}>
            {Array.from({ length: fields }, (_, field) => <div className={`space-y-2 ${field === fields - 1 && fields % 2 === 1 ? "sm:col-span-2" : ""}`} key={field}><Bone className="h-3 w-24" /><Bone className="h-10 w-full" /></div>)}
          </div>
        </section>
      ))}
      <div className="flex justify-end gap-3"><Bone className="h-10 w-24" /><Bone className="h-10 w-32" /></div>
    </div>
  );
}

function DashboardData() {
  return (
    <div className="mt-7">
      <section className="rounded-card bg-surface shadow-card">
        <header className="flex items-center gap-3 border-b border-border-default/70 px-5 py-4 sm:px-6"><Bone className="size-9 rounded-xl" /><div><Bone className="h-4 w-36" /><Bone className="mt-2 h-3 w-56 max-w-full" /></div></header>
        <div className="divide-y divide-border-default/70 px-5 sm:px-6">{[0, 1, 2].map((item) => <div className="py-3.5" key={item}><Bone className="h-4 w-3/4" /><Bone className="mt-2 h-3 w-1/2" /></div>)}</div>
      </section>
      <section className="mt-8"><Bone className="h-5 w-48" /><Bone className="mt-2 h-4 w-72 max-w-full" /><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div className="flex min-h-36 flex-col justify-between rounded-card bg-surface p-5 shadow-card" key={item}><Bone className="size-10 rounded-xl" /><div><Bone className="h-4 w-36" /><Bone className="mt-2 h-3 w-44 max-w-full" /></div></div>)}</div></section>
      <section className="group mt-8 overflow-hidden rounded-card bg-surface shadow-card">
        <header className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div><Bone className="h-5 w-52" /><Bone className="mt-2 h-4 w-72 max-w-full" /></div><Bone className="h-8 w-32 rounded-full" /></header>
        <div className="grid gap-3 bg-canvas/65 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">{[0, 1, 2, 3, 4, 5].map((item) => <div className={`flex min-h-28 flex-col justify-between rounded-card bg-surface p-5 shadow-card ${item === 5 ? "sm:col-span-2 lg:col-span-2" : ""}`} key={item}><Bone className="h-3 w-28" /><Bone className="h-8 w-20" />{item === 5 ? <Bone className="h-2 w-full rounded-full" /> : null}</div>)}</div>
      </section>
      <section className="mt-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Bone className="h-5 w-32" /><Bone className="mt-2 h-4 w-64 max-w-full" /></div><Bone className="h-4 w-28" /></div><div className="mt-4"><TableRows columns={5} rows={4} /></div></section>
    </div>
  );
}

function ScheduleData() {
  return (
    <div className="mt-6 divide-y divide-border-default rounded-card bg-surface px-5 shadow-card sm:px-7">
      <section className="py-6"><Bone className="h-5 w-36" /><div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div className="space-y-2" key={item}><Bone className="h-3 w-20" /><Bone className="h-4 w-3/4" /></div>)}</div></section>
      <section className="py-5"><div className="flex gap-2"><Bone className="h-9 w-24" /><Bone className="h-9 w-20" /><Bone className="h-9 w-28" /></div><div className="mt-5 flex items-center justify-between gap-4"><Bone className="h-5 w-40" /><Bone className="h-9 w-24" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((item) => <Bone className="h-16 w-full" key={item} />)}</div></section>
    </div>
  );
}

function WorkerHomeData() {
  return <div className="mt-6 space-y-6"><section><Bone className="h-3 w-20" /><div className="mt-3 rounded-card bg-surface p-5 shadow-card sm:p-6"><Bone className="h-5 w-40" /><Bone className="mt-3 h-4 w-56 max-w-full" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Bone className="h-3 w-20" /><Bone className="mt-2 h-4 w-32" /></div><div><Bone className="h-3 w-20" /><Bone className="mt-2 h-4 w-32" /></div></div><Bone className="mt-5 h-11 w-full sm:w-48" /></div></section><section><Bone className="h-3 w-36" /><div className="mt-3 rounded-card bg-surface p-5 shadow-card"><Bone className="h-5 w-32" /><Bone className="mt-3 h-4 w-52" /><Bone className="mt-4 h-4 w-28" /></div></section></div>;
}

function WorkerScheduleData() {
  return <div className="mt-6"><div className="grid grid-cols-2 gap-3"><Bone className="h-11 w-full" /><Bone className="h-11 w-full" /></div><div className="mt-6 space-y-4">{[0, 1, 2, 3].map((item) => <section className="rounded-card bg-surface p-5 shadow-card" key={item}><div className="flex flex-wrap items-center justify-between gap-3"><Bone className="h-5 w-32" /><Bone className="h-6 w-24 rounded-full" /></div><Bone className="mt-3 h-4 w-56 max-w-full" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Bone className="h-3 w-20" /><Bone className="mt-2 h-4 w-32" /></div><div><Bone className="h-3 w-20" /><Bone className="mt-2 h-4 w-32" /></div></div></section>)}</div></div>;
}

function WorkerHistoryData() {
  return <div className="mt-6 space-y-4">{[0, 1, 2, 3, 4].map((item) => <article className="rounded-card bg-surface p-5 shadow-card" key={item}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><Bone className="h-5 w-40" /><Bone className="mt-2 h-4 w-52 max-w-full" /></div><Bone className="h-7 w-24 rounded-full" /></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Bone className="h-3 w-20" /><Bone className="mt-2 h-4 w-36" /></div><div><Bone className="h-3 w-20" /><Bone className="mt-2 h-4 w-36" /></div></div><Bone className="mt-4 h-4 w-36" /><Bone className="mt-4 h-4 w-28" /></article>)}</div>;
}

function WorkerData({ kind, label }: { kind: Exclude<SkeletonKind, "dashboard" | "schedule">; label: string }) {
  if (kind === "worker") return <WorkerHomeData />;
  if (kind === "collection") return label.toLocaleLowerCase("pt-BR").includes("histórico") ? <WorkerHistoryData /> : <CollectionData label={label} />;
  if (kind === "form") return <FormData label={label} />;
  return <DetailData label={label} />;
}

function ClaimData() {
  return <div className="space-y-5"><Bone className="h-7 w-56" /><Bone className="h-4 w-full" /><section className="rounded-control bg-subtle/40 p-4"><Bone className="h-3 w-40" /><Bone className="mt-3 h-5 w-3/4" /><Bone className="mt-2 h-4 w-2/3" /></section><Bone className="h-10 w-full" /></div>;
}

export function DataRouteSkeleton({ kind, label, scope = "core" }: { kind: SkeletonKind; label: string; scope?: SkeletonScope }) {
  const content = scope === "core" && kind === "collection"
    ? <CoreCollectionData label={label} />
    : scope === "core" && kind === "detail"
    ? <CoreDetailData label={label} />
    : scope === "core" && kind === "form"
    ? <CoreFormData label={label} />
    : scope === "worker" && kind === "schedule"
    ? <WorkerScheduleData />
    : kind === "collection"
    ? <CollectionData label={label} />
    : kind === "detail"
      ? <DetailData label={label} />
      : kind === "form"
        ? <FormData label={label} />
        : kind === "dashboard"
          ? <DashboardData />
          : kind === "schedule"
            ? <ScheduleData />
            : kind === "claim"
              ? <ClaimData />
              : <WorkerData kind={kind} label={label} />;

  if (scope === "worker-public") {
    return <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-8 sm:px-6 sm:py-12"><section className="w-full rounded-card bg-surface p-6 shadow-card sm:p-8"><div aria-busy="true" aria-label={label} role="status"><span className="sr-only">{label}…</span>{content}</div></section></main>;
  }

  if (scope === "worker") {
    return <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12"><div aria-busy="true" aria-label={label} role="status"><span className="sr-only">{label}…</span>{content}</div></main>;
  }

  if (scope === "drawer") {
    return <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30"><section aria-busy="true" aria-label={label} className="h-full w-full max-w-2xl overflow-y-auto bg-canvas p-5 shadow-card sm:p-8" role="status"><span className="sr-only">{label}…</span><div className="mb-6 flex items-center justify-between"><Bone className="h-4 w-32" /><Bone className="size-9 rounded-full" /></div><FormData label={label} /></section></div>;
  }

  const normalizedLabel = label.toLocaleLowerCase("pt-BR");
  const hasHeaderAction = kind === "detail" || kind === "schedule" || (kind === "collection" && !["presença", "ausência", "auditoria"].some((term) => normalizedLabel.includes(term)));
  return <PageShell className="py-7 sm:py-8"><ContentContainer size={kind === "detail" || kind === "schedule" ? "detail-wide" : kind === "form" ? "form" : "list"}><div aria-busy="true" aria-label={label} role="status"><span className="sr-only">{label}…</span>{kind === "dashboard" ? <><PageHeading dashboard />{content}</> : <><PageHeading action={hasHeaderAction} />{content}</>}</div></ContentContainer></PageShell>;
}

export function createDataRouteLoading(kind: SkeletonKind, label: string, scope: SkeletonScope = "core") {
  return function RouteDataLoading() {
    return <DataRouteSkeleton kind={kind} label={label} scope={scope} />;
  };
}
