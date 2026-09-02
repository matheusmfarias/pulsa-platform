"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { Input } from "@/components/ui/input";
import { setOperationalContextAction } from "@/modules/operational-context/actions";
import {
  safePathAfterOperationalContextChange,
  type OperationalContext,
  type OperationalContextState,
} from "@/modules/operational-context/domain/operational-context";
import { cn } from "@/shared/utils";

function contextKey(context: OperationalContext): string {
  if (context.type === "all") return "all";
  if (context.type === "client") return `client:${context.clientId}`;
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
        "flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-1 text-left transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "all" && "text-sm font-medium text-foreground",
        variant === "client-scope" && "text-xs font-medium text-muted-foreground",
        variant === "contract" && "text-[0.8125rem] font-normal text-muted-foreground",
        indented && "pl-5",
        selected && "bg-muted/80 text-foreground",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected ? <Check className="size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
    </button>
  );
}

export function OperationalContextSwitcher({
  state,
}: {
  state: OperationalContextState;
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

  const selectedClientId =
    state.context.type === "all" ? null : state.context.clientId;
  const selectedContractId =
    state.context.type === "contract" ? state.context.contractId : null;
  const selectedClient = selectedClientId
    ? state.options.find((client) => client.id === selectedClientId) ?? null
    : null;
  const selectedContract =
    selectedContractId
      ? selectedClient?.contracts.find(
          (contract) => contract.id === selectedContractId,
        ) ?? null
      : null;
  const title = selectedClient?.name ?? "Todos os clientes";
  const subtitle = selectedContract?.name ??
    (selectedClient ? "Todos os contratos" : "Visão consolidada");
  const selectedKey = contextKey(state.context);

  const visibleOptions = useMemo(() => {
    const term = normalizeSearch(query.trim());
    if (!term) return state.options;
    return state.options
      .map((client) => {
        const clientMatches = normalizeSearch(client.name).includes(term);
        const contracts = clientMatches
          ? client.contracts
          : client.contracts.filter((contract) =>
              normalizeSearch(contract.name).includes(term),
            );
        return clientMatches || contracts.length > 0
          ? { ...client, contracts }
          : null;
      })
      .filter((client): client is NonNullable<typeof client> => client !== null);
  }, [query, state.options]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function selectContext(context: OperationalContext) {
    if (contextKey(context) === selectedKey) {
      setIsOpen(false);
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
        setIsOpen(false);
        setQuery("");
        const destination = safePathAfterOperationalContextChange(pathname);
        if (destination === pathname) router.refresh();
        else router.replace(destination);
      } catch {
        setMessage("Não foi possível atualizar o contexto. Tente novamente.");
      }
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Contexto operacional: ${title}, ${subtitle}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={isPending}
        onClick={() => {
          setIsOpen((open) => !open);
          setMessage(null);
          requestAnimationFrame(() => searchInputRef.current?.focus());
        }}
        className="flex min-h-12 w-full items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-left transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-5" title={title}>{title}</span>
          <span className="block truncate text-xs leading-4 text-muted-foreground" title={subtitle}>{subtitle}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.375rem)] z-50 w-full overflow-hidden rounded-md border bg-card shadow-lg">
          <div className="border-b p-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-[0.5625rem] size-3.5 text-muted-foreground" aria-hidden="true" />
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-8 border-border bg-muted/35 pl-8 text-xs"
                placeholder="Buscar cliente ou contrato"
                aria-label="Buscar cliente ou contrato"
              />
            </div>
          </div>
          <div role="listbox" aria-label="Contextos operacionais" className="max-h-[min(22rem,55vh)] overflow-y-auto p-1.5 [scrollbar-gutter:stable]">
            <ContextOption context={{ type: "all" }} label="Todos os clientes" variant="all" isPending={isPending} onSelect={selectContext} selectedKey={selectedKey} />
            {visibleOptions.length > 0 ? (
              <p className="mb-1 mt-2 px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Clientes</p>
            ) : null}
            {visibleOptions.map((client) => (
              <div key={client.id} className="mb-1.5 border-t pt-1.5 first:border-t-0 first:pt-0">
                <p className="truncate px-2.5 pb-0.5 text-sm font-semibold leading-5 text-foreground" title={client.name}>{client.name}</p>
                <ContextOption context={{ type: "client", clientId: client.id }} label="Todos os contratos" variant="client-scope" indented isPending={isPending} onSelect={selectContext} selectedKey={selectedKey} />
                {client.contracts.map((contract) => (
                  <ContextOption
                    key={contract.id}
                    context={{ type: "contract", clientId: client.id, contractId: contract.id }}
                    label={contract.name}
                    indented
                    variant="contract"
                    isPending={isPending}
                    onSelect={selectContext}
                    selectedKey={selectedKey}
                  />
                ))}
              </div>
            ))}
            {visibleOptions.length === 0 && query ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum cliente ou contrato encontrado.</p>
            ) : null}
          </div>
          {message ? <p className="border-t px-3 py-2 text-xs text-destructive" role="alert">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
