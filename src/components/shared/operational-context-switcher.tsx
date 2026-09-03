"use client";

import { Check, ChevronsUpDown, Layers3, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { setOperationalContextAction } from "@/modules/operational-context/actions";
import {
  safePathAfterOperationalContextChange,
  type OperationalContext,
  type OperationalContextState,
} from "@/modules/operational-context/domain/operational-context";
import { cn } from "@/shared/utils";
import { RailTooltip } from "@/components/ui/rail-tooltip";

function contextKey(context: OperationalContext): string {
  if (context.type === "all") return "all";
  if (context.type === "client") {
    return `client:${context.clientId}`;
  }

  return `contract:${context.clientId}:${context.contractId}`;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function ContextOption({
  context,
  isPending,
  label,
  onSelect,
  selectedKey,
  indented = false,
  variant = "contract",
}: {
  context: OperationalContext;
  isPending: boolean;
  label: string;
  onSelect: (context: OperationalContext) => void;
  selectedKey: string;
  indented?: boolean;
  variant?: "all" | "client-scope" | "contract";
}) {
  const selected = contextKey(context) === selectedKey;

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={label}
      title={label}
      disabled={isPending}
      onClick={() => onSelect(context)}
      className={cn(
        "flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-1 text-left transition-colors",
        "hover:bg-hover hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-60",
        variant === "all" && "text-sm font-medium text-foreground",
        variant === "client-scope" &&
          "text-xs font-medium text-muted-foreground",
        variant === "contract" &&
          "text-[0.8125rem] font-normal text-muted-foreground",
        indented && "pl-5",
        selected && "bg-primary/10 text-foreground",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>

      {selected ? (
        <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
      ) : null}
    </button>
  );
}

export function OperationalContextSwitcher({
  state,
  variant = "inline",
}: {
  state: OperationalContextState;
  variant?: "inline" | "rail";
}) {
  const pathname = usePathname() ?? "/app";
  const router = useRouter();

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const rail = variant === "rail";

  const selectedClientId =
    state.context.type === "all" ? null : state.context.clientId;

  const selectedClient = selectedClientId
    ? (state.options.find((client) => client.id === selectedClientId) ?? null)
    : null;

  const title = selectedClient?.name ?? "Todos os clientes";

  const selectedKey =
    state.context.type === "contract"
      ? `client:${state.context.clientId}`
      : contextKey(state.context);

  const visibleOptions = useMemo(() => {
    const term = normalizeSearch(query.trim());

    if (!term) return state.options;

    return state.options.filter((client) =>
      normalizeSearch(client.name).includes(term),
    );
  }, [query, state.options]);

  function closeSwitcher({
    restoreFocus = false,
  }: {
    restoreFocus?: boolean;
  } = {}) {
    setIsOpen(false);
    setQuery("");
    setMessage(null);

    if (restoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeSwitcher();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSwitcher({
          restoreFocus: true,
        });
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function toggleSwitcher() {
    setMessage(null);

    setIsOpen((open) => {
      const next = !open;

      if (next) {
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
      } else {
        setQuery("");
      }

      return next;
    });
  }

  function selectContext(context: OperationalContext) {
    if (contextKey(context) === selectedKey) {
      closeSwitcher();
      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        const result = await setOperationalContextAction(context);

        if (!result.ok) {
          setMessage(result.message);
          return;
        }

        closeSwitcher();

        const destination = safePathAfterOperationalContextChange(pathname);

        if (destination === pathname) {
          router.refresh();
        } else {
          router.replace(destination);
        }
      } catch {
        setMessage("Não foi possível atualizar o contexto. Tente novamente.");
      }
    });
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative", rail && "flex justify-center")}
    >
      {rail ? (
        <RailTooltip label={title}>
          <button
            ref={triggerRef}
            type="button"
            aria-label={`Contexto operacional: ${title}`}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            disabled={isPending}
            onClick={toggleSwitcher}
            className={cn(
              "mx-auto flex size-9 items-center justify-center rounded-lg text-muted-foreground",
              "transition-colors hover:bg-hover hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-60",
              isOpen && "bg-primary/10 text-primary",
            )}
          >
            <Layers3 className="size-4" aria-hidden="true" />
          </button>
        </RailTooltip>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          aria-label={`Contexto operacional: ${title}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={isPending}
          onClick={toggleSwitcher}
          className={cn(
            "flex min-h-12 w-full items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-left",
            "transition-colors hover:bg-hover",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:opacity-60",
          )}
        >
          <span className="min-w-0 flex-1">
            <span
              className="block truncate text-sm font-semibold leading-5"
              title={title}
            >
              {title}
            </span>
          </span>

          <ChevronsUpDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      )}

      {isOpen ? (
        <div
          className={cn(
            "z-50 overflow-hidden rounded-lg border border-border bg-card shadow-lg",
            rail
              ? "absolute left-[calc(100%+0.75rem)] top-0 w-[19rem] origin-left animate-in fade-in-0 slide-in-from-left-1"
              : "absolute left-0 top-[calc(100%+0.375rem)] w-full",
          )}
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 border-border bg-muted/35 pl-8 text-xs"
                placeholder="Buscar cliente"
                aria-label="Buscar cliente"
              />
            </div>
          </div>

          <div
            role="listbox"
            aria-label="Contextos operacionais"
            className="max-h-[min(24rem,60vh)] overflow-y-auto p-2"
          >
            <ContextOption
              context={{ type: "all" }}
              label="Todos os clientes"
              variant="all"
              isPending={isPending}
              onSelect={selectContext}
              selectedKey={selectedKey}
            />

            {visibleOptions.length > 0 ? (
              <div className="my-2 h-px bg-border" />
            ) : null}

            {visibleOptions.map((client) => (
              <ContextOption
                key={client.id}
                context={{
                  type: "client",
                  clientId: client.id,
                }}
                label={client.name}
                variant="all"
                isPending={isPending}
                onSelect={selectContext}
                selectedKey={selectedKey}
              />
            ))}

            {visibleOptions.length === 0 && query ? (
              <p className="px-3 py-8 text-center text-sm leading-6 text-muted-foreground">
                Nenhum cliente encontrado.
              </p>
            ) : null}
          </div>

          {message ? (
            <p
              className="border-t border-border px-3 py-2 text-xs text-destructive"
              role="alert"
            >
              {message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
