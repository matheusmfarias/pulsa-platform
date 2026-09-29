"use client";

import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { ActiveFiltersSummary, ListFilterBar } from "@/components/layout/list";
import { ListPendingSurface, useListNavigation } from "@/components/layout/list-navigation";
import { Button } from "@/components/ui/button";
import { FilterSelect, type FilterSelectOption } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, type AuditAction, type AuditEntityType, type AuditListFilters } from "@/modules/administration";

const entityOptions: FilterSelectOption<string>[] = [
  { label: "Todas", value: "all" },
  ...Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => ({ value, label })),
];
const actionOptions: FilterSelectOption<string>[] = [
  { label: "Todas", value: "all" },
  ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label })),
];

type AuditDraft = Pick<AuditListFilters, "from" | "to" | "entityType" | "action" | "actorId">;

function getCurrentFilters(searchParams: URLSearchParams): AuditDraft {
  return {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    entityType: searchParams.get("entityType") as AuditListFilters["entityType"] || undefined,
    action: searchParams.get("action") as AuditAction | undefined,
    actorId: searchParams.get("actorId") || undefined,
  };
}

export function AuditListFilterBar({
  actorOptions,
  children,
  filters,
}: {
  actorOptions: FilterSelectOption<string>[];
  children: React.ReactNode;
  filters: AuditListFilters;
}) {
  const searchParams = useSearchParams();
  const { navigate } = useListNavigation();
  const initial = React.useMemo(() => getCurrentFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [draft, setDraft] = React.useState<AuditDraft>({
    from: filters.from,
    to: filters.to,
    entityType: filters.entityType,
    action: filters.action,
    actorId: filters.actorId,
  });
  const expectedSearchRef = React.useRef(searchParams.toString());

  React.useEffect(() => {
    const currentSearch = searchParams.toString();
    if (currentSearch === expectedSearchRef.current) return;
    expectedSearchRef.current = currentSearch;
    setDraft(initial);
  }, [initial, searchParams]);

  const navigateWithFilters = React.useCallback((next: AuditDraft) => {
    const params = new URLSearchParams();
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    if (next.entityType) params.set("entityType", next.entityType);
    if (next.action) params.set("action", next.action);
    if (next.actorId) params.set("actorId", next.actorId);
    if (filters.pageSize !== 10) params.set("size", String(filters.pageSize));
    const nextSearch = params.toString();
    if (nextSearch === searchParams.toString()) return;
    expectedSearchRef.current = nextSearch;
    navigate(nextSearch ? `/app/admin/audit?${nextSearch}` : "/app/admin/audit", "replace");
  }, [filters.pageSize, navigate, searchParams]);

  React.useEffect(() => {
    const changed = draft.from !== filters.from || draft.to !== filters.to;
    if (!changed) return;
    if (draft.from && draft.to && draft.from > draft.to) return;
    const timeout = window.setTimeout(() => navigateWithFilters(draft), 350);
    return () => window.clearTimeout(timeout);
  }, [draft, filters.from, filters.to, navigateWithFilters]);

  const activeLabels = [
    draft.from ? `De: ${draft.from}` : null,
    draft.to ? `Até: ${draft.to}` : null,
    draft.entityType ? `Entidade: ${AUDIT_ENTITY_LABELS[draft.entityType]}` : null,
    draft.action ? `Ação: ${AUDIT_ACTION_LABELS[draft.action]}` : null,
    draft.actorId ? `Ator: ${actorOptions.find((option) => option.value === draft.actorId)?.label ?? draft.actorId}` : null,
  ].filter(Boolean);
  const invalidRange = Boolean(draft.from && draft.to && draft.from > draft.to);

  function update<K extends keyof AuditDraft>(key: K, value: AuditDraft[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (key === "entityType" || key === "action" || key === "actorId") navigateWithFilters(next);
  }

  function clearFilters() {
    const empty: AuditDraft = {};
    setDraft(empty);
    navigateWithFilters(empty);
  }

  return (
    <>
      <ListFilterBar aria-label="Filtros da auditoria" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">De<Input aria-label="Data inicial da auditoria" onChange={(event) => update("from", event.target.value || undefined)} type="date" value={draft.from ?? ""} /></label>
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Até<Input aria-label="Data final da auditoria" onChange={(event) => update("to", event.target.value || undefined)} type="date" value={draft.to ?? ""} /></label>
        <FilterSelect ariaLabel="Filtrar auditoria por entidade" label="Entidade" onValueChange={(value) => update("entityType", value === "all" ? undefined : value as AuditEntityType)} options={entityOptions} value={draft.entityType ?? "all"} />
        <FilterSelect ariaLabel="Filtrar auditoria por ação" label="Ação" onValueChange={(value) => update("action", value === "all" ? undefined : value as AuditAction)} options={actionOptions} value={draft.action ?? "all"} />
        <FilterSelect ariaLabel="Filtrar auditoria por ator" label="Ator" onValueChange={(value) => update("actorId", value === "all" ? undefined : value)} options={[{ label: "Todos", value: "all" }, ...actorOptions]} value={draft.actorId ?? "all"} />
        {activeLabels.length ? (
          <div className="flex w-full min-w-0 items-center gap-2 border-t border-border-default pt-3 sm:col-span-2 xl:col-span-5">
            <ActiveFiltersSummary className="min-w-0 flex-1 border-0 pt-0">
              <span className="font-medium text-foreground">Filtros ativos:</span>{" "}{activeLabels.join(" · ")}
              {invalidRange ? <span className="ml-2 text-status-danger-foreground">A data inicial deve ser anterior à final.</span> : null}
            </ActiveFiltersSummary>
            <Button aria-label="Limpar filtros da auditoria" className="shrink-0" onClick={clearFilters} size="icon" type="button" variant="ghost"><X aria-hidden="true" className="size-4" /></Button>
          </div>
        ) : null}
      </ListFilterBar>
      <ListPendingSurface className="mt-5">{children}</ListPendingSurface>
    </>
  );
}
