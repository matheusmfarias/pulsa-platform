"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ActiveFilters } from "@/components/layout/list";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  FilterSelect,
  type FilterSelectOption,
} from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils";

import {
  WORKER_STATUS_LABELS,
  type WorkerStatus,
} from "../domain/worker";
import { parseWorkerListSearchParams, workerListHref } from "./worker-list-filters";

type WorkerStatusFilter = WorkerStatus | "all";

export const WORKER_SEARCH_DEBOUNCE_MS = 350;

const STATUS_OPTIONS: FilterSelectOption<WorkerStatusFilter>[] = [
  { label: "Todos os status", value: "all" },
  { label: WORKER_STATUS_LABELS.onboarding, value: "onboarding" },
  { label: WORKER_STATUS_LABELS.active, value: "active" },
  { label: WORKER_STATUS_LABELS.inactive, value: "inactive" },
  { label: WORKER_STATUS_LABELS.terminated, value: "terminated" },
];
const STATUS_VALUES = new Set<WorkerStatusFilter>(
  STATUS_OPTIONS.map((option) => option.value),
);

function readStatusFilter(value: string | null): WorkerStatusFilter {
  return value && STATUS_VALUES.has(value as WorkerStatusFilter)
    ? (value as WorkerStatusFilter)
    : "all";
}

export function WorkerFilterBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const suppressDebounceRef = React.useRef(false);
  const appliedQuery = searchParams.get("q") ?? "";
  const status = readStatusFilter(searchParams.get("status"));
  const [queryDraft, setQueryDraft] = React.useState({
    source: appliedQuery,
    value: appliedQuery,
  });
  const query =
    queryDraft.source === appliedQuery ? queryDraft.value : appliedQuery;
  const hasActiveFilters = Boolean(appliedQuery) || status !== "all";

  const replaceFilters = React.useCallback(
    (updates: { query?: string; status?: WorkerStatusFilter }) => {
      const filters = parseWorkerListSearchParams({
        q: updates.query ?? query,
        status: updates.status ?? status,
      });
      startTransition(() => {
        router.replace(workerListHref("/app/workers", filters), { scroll: false });
      });
    },
    [query, router, status],
  );

  React.useEffect(() => {
    if (suppressDebounceRef.current) {
      suppressDebounceRef.current = false;
      return;
    }

    if (query.trim() === appliedQuery) return;

    const timeout = window.setTimeout(() => {
      replaceFilters({ query });
    }, WORKER_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [appliedQuery, query, replaceFilters]);

  function clearQuery() {
    suppressDebounceRef.current = true;
    setQueryDraft({ source: appliedQuery, value: "" });
    replaceFilters({ query: "" });
  }

  function clearAllFilters() {
    suppressDebounceRef.current = true;
    setQueryDraft({ source: appliedQuery, value: "" });
    startTransition(() => router.replace("/app/workers", { scroll: false }));
  }

  return (
    <section
      aria-label="Lista de colaboradores"
      className="mt-6 overflow-hidden rounded-surface border border-border-strong/70 bg-surface"
    >
      <div
        aria-label="Filtros de colaboradores"
        className="p-3 sm:p-4"
        role="search"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Buscar colaboradores por nome ou CPF"
              className="border-border-strong bg-background pl-9 shadow-[0_1px_0_rgb(0_0_0/0.02)]"
              name="q"
              onChange={(event) =>
                setQueryDraft({ source: appliedQuery, value: event.target.value })
              }
              placeholder="Buscar por nome ou CPF"
              type="search"
              value={query}
            />
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <FilterSelect
              ariaLabel="Filtrar colaboradores por status"
              label="Status"
              onValueChange={(value) => {
                if (value !== status) {
                  suppressDebounceRef.current = true;
                  replaceFilters({ status: value });
                }
              }}
              options={STATUS_OPTIONS}
              value={status}
            />
            <span
              aria-live="polite"
              className="inline-flex min-w-4 items-center gap-1.5 text-xs text-muted-foreground"
            >
              {isPending ? (
                <>
                  <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                </>
              ) : null}
            </span>
          </div>
        </div>

        {hasActiveFilters ? (
          <ActiveFilters className="mt-3 min-w-0 gap-1.5 border-border-default/70 pt-2.5">
            {appliedQuery ? (
              <FilterChip
                onRemove={clearQuery}
                removeLabel="Remover filtro de busca"
              >
                Busca: {appliedQuery}
              </FilterChip>
            ) : null}
            {status !== "all" ? (
              <FilterChip
                onRemove={() => replaceFilters({ status: "all" })}
                removeLabel="Remover filtro de status"
              >
                Status: {WORKER_STATUS_LABELS[status]}
              </FilterChip>
            ) : null}
            <Button
              className="ml-auto h-7 shrink-0 px-2 text-xs"
              onClick={clearAllFilters}
              type="button"
              variant="ghost"
            >
              Limpar filtros
            </Button>
          </ActiveFilters>
        ) : null}
      </div>

      <div
        aria-busy={isPending}
        className="border-t border-border-default/80"
      >
        <div
          className={cn(
            "transition-opacity duration-150",
            isPending && "opacity-70",
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
