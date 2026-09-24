"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  CalendarX2,
  ClipboardCheck,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ScrollText,
  Tags,
  UserCog,
  UserRound,
  UserRoundCheck,
  Users,
  X,
  Ellipsis,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { OperationalContextSwitcher } from "@/components/shared/operational-context-switcher";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/modules/auth/actions";
import type { OperationalContextState } from "@/modules/operational-context/domain/operational-context";
import { cn } from "@/shared/utils";
import { RailTooltip } from "@/components/ui/rail-tooltip";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  matches?: (pathname: string) => boolean;
};

type NavigationGroup = { items: NavigationItem[]; label?: string };

const matchesResource = (href: string) => (pathname: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const SIDEBAR_GROUPS_STORAGE_KEY = "pulsa-sidebar-group-preferences-v2";

export const authenticatedNavigation: NavigationGroup[] = [
  {
    items: [
      {
        href: "/app",
        icon: LayoutDashboard,
        label: "Visão geral",
        matches: (pathname) => pathname === "/app",
      },
    ],
  },
  {
    label: "Rotina",
    items: [
      {
        href: "/app/scheduling",
        icon: CalendarDays,
        label: "Escalas",
        matches: matchesResource("/app/scheduling"),
      },
      {
        href: "/app/absences",
        icon: CalendarX2,
        label: "Ausências",
        matches: matchesResource("/app/absences"),
      },
      {
        href: "/app/presences",
        icon: ClipboardCheck,
        label: "Presença",
        matches: matchesResource("/app/presences"),
      },
      {
        href: "/app/assignments",
        icon: UserRoundCheck,
        label: "Alocações",
        matches: matchesResource("/app/assignments"),
      },
    ],
  },
  {
    label: "Estrutura",
    items: [
      {
        href: "/app/operations",
        icon: BriefcaseBusiness,
        label: "Operações",
        matches: matchesResource("/app/operations"),
      },
      {
        href: "/app/units",
        icon: MapPin,
        label: "Unidades",
        matches: (pathname) =>
          (pathname === "/app/units" ||
            /^\/app\/units\/[^/]+(?:\/edit)?$/.test(pathname)) &&
          !pathname.includes("/positions"),
      },
      {
        href: "/app/job-roles",
        icon: Tags,
        label: "Cargos",
        matches: matchesResource("/app/job-roles"),
      },
      {
        href: "/app/positions",
        icon: BriefcaseBusiness,
        label: "Postos",
        matches: (pathname) =>
          pathname === "/app/positions" ||
          /^\/app\/units\/[^/]+\/positions(?:\/|$)/.test(pathname),
      },
    ],
  },
  {
    label: "Pessoas",
    items: [
      {
        href: "/app/workers",
        icon: Users,
        label: "Colaboradores",
        matches: matchesResource("/app/workers"),
      },
    ],
  },
  {
    label: "Clientes e contratos",
    items: [
      {
        href: "/app/clients",
        icon: Building2,
        label: "Clientes",
        matches: matchesResource("/app/clients"),
      },
      {
        href: "/app/contracts",
        icon: FileText,
        label: "Contratos",
        matches: matchesResource("/app/contracts"),
      },
    ],
  },
];

const administrationNavigation: NavigationGroup = {
  label: "Administração",
  items: [
    {
      href: "/app/admin/users",
      icon: UserCog,
      label: "Usuários",
      matches: matchesResource("/app/admin/users"),
    },
    {
      href: "/app/admin/audit",
      icon: ScrollText,
      label: "Auditoria",
      matches: matchesResource("/app/admin/audit"),
    },
  ],
};

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  return item.matches?.(pathname) ?? pathname === item.href;
}

const navigationKeywords: Record<string, string> = {
  "/app/presences": "ponto chegada registro comparecimento",
  "/app/absences": "faltas cobertura substituição",
  "/app/scheduling": "jornadas planejamento publicação",
  "/app/assignments": "vínculo colaborador posto",
  "/app/workers": "pessoas funcionários equipe rh",
  "/app/positions": "vagas efetivo",
  "/app/admin/users": "acessos permissões",
};

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function NavigationSearch({ collapsed = false, shortcut = false, showAdministration }: { collapsed?: boolean; shortcut?: boolean; showAdministration: boolean }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const navigation = showAdministration ? [...authenticatedNavigation, administrationNavigation] : authenticatedNavigation;
  const results = navigation.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label ?? "Início" })))
    .filter((item) => normalizeSearch(`${item.label} ${item.group} ${navigationKeywords[item.href] ?? ""}`).includes(normalizeSearch(query)));
  const currentIndex = Math.min(activeIndex, Math.max(0, results.length - 1));

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current;
    if (!dialog.open) dialog.showModal();
    inputRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      returnFocusRef.current?.focus();
    };
  }, [open]);

  function choose(href: string) {
    setOpen(false);
    router.push(href);
  }

  return <>
    <button
      aria-label="Buscar página ou tarefa"
      className={cn("flex min-h-10 items-center rounded-control border border-border-default bg-surface text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring", collapsed ? "w-10 justify-center" : "w-full gap-2 px-3")}
      onClick={() => { setQuery(""); setActiveIndex(0); setOpen(true); }}
      ref={triggerRef}
      type="button"
    >
      <Search aria-hidden="true" className="size-4 shrink-0" />
      {!collapsed ? <><span className="min-w-0 flex-1 truncate text-left">Buscar no Pulsa</span>{shortcut ? <kbd className="shrink-0 rounded border border-border-default px-1.5 py-0.5 text-[11px]">Ctrl K</kbd> : null}</> : null}
    </button>
    <dialog
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-surface border border-border-default bg-surface p-0 text-foreground shadow-xl outline-none backdrop:bg-foreground/30"
      onCancel={(event) => { event.preventDefault(); setOpen(false); }}
      onClick={(event) => { if (event.target === dialogRef.current) setOpen(false); }}
      ref={dialogRef}
    >
      <div className="border-b border-border-default px-4 py-4">
        <h2 className="text-sm font-semibold" id={titleId}>Ir para uma página</h2>
        <div className="mt-3 flex items-center gap-2">
          <Search aria-hidden="true" className="size-4 text-muted-foreground" />
          <input
            aria-activedescendant={results.length ? `${titleId}-result-${currentIndex}` : undefined}
            aria-controls={`${titleId}-results`}
            aria-expanded="true"
            aria-label="Buscar página ou tarefa"
            aria-autocomplete="list"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((current) => Math.min(current + 1, results.length - 1)); }
              if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)); }
              if (event.key === "Enter" && results[currentIndex]) { event.preventDefault(); choose(results[currentIndex].href); }
            }}
            placeholder="Ex.: falta, presença, colaborador"
            ref={inputRef}
            role="combobox"
            type="search"
            value={query}
          />
        </div>
      </div>
      <div className="max-h-[min(26rem,60dvh)] overflow-y-auto p-2" id={`${titleId}-results`} role="listbox">
        {results.length ? results.map((item, index) => {
          const Icon = item.icon;
          return <button
            aria-selected={index === currentIndex}
            className={cn("flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring", index === currentIndex ? "bg-primary/10 text-primary" : "hover:bg-hover")}
            id={`${titleId}-result-${index}`}
            key={item.href}
            onClick={() => choose(item.href)}
            onMouseEnter={() => setActiveIndex(index)}
            role="option"
            type="button"
          ><Icon aria-hidden="true" className="size-4 shrink-0" /><span className="flex-1 font-medium">{item.label}</span><span className="text-xs text-muted-foreground">{item.group}</span></button>;
        }) : <p className="px-3 py-8 text-center text-sm text-muted-foreground">Nenhuma página encontrada. Tente outro termo.</p>}
      </div>
      <p className="border-t border-border-default px-4 py-2 text-xs text-muted-foreground">Use as setas para escolher e Enter para abrir. Esc fecha a busca.</p>
    </dialog>
  </>;
}

function NavigationLinks({
  collapsed = false,
  onNavigate,
  showAdministration,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  showAdministration: boolean;
}) {
  const pathname = usePathname() ?? "/app";

  const [groupPreferences, setGroupPreferences] = useState<Record<string, boolean>>({});

  const navigation = showAdministration
    ? [...authenticatedNavigation, administrationNavigation]
    : authenticatedNavigation;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(SIDEBAR_GROUPS_STORAGE_KEY);

        if (!stored) return;

        const parsed: unknown = JSON.parse(stored);

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;

        setGroupPreferences(
          Object.fromEntries(
            Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
          ),
        );
      } catch {
        // Preferências inválidas não devem impedir a navegação.
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleGroup(label: string, collapsedNow: boolean) {
    setGroupPreferences((current) => {
      const next = { ...current, [label]: !collapsedNow };

      window.localStorage.setItem(
        SIDEBAR_GROUPS_STORAGE_KEY,
        JSON.stringify(next),
      );

      return next;
    });
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="space-y-3"
    >
      {navigation.map((group, groupIndex) => {
        const groupId = `navigation-group-${groupIndex}`;

        const activeGroup = group.items.some((item) => isNavigationItemActive(item, pathname));
        const defaultCollapsed = group.label !== "Rotina" && !activeGroup;
        const groupCollapsed = !collapsed && Boolean(group.label) &&
          (groupPreferences[group.label!] ?? defaultCollapsed);

        return (
          <section
            key={group.label ?? "overview"}
            aria-labelledby={group.label ? groupId : undefined}
          >
            {group.label ? (
              collapsed ? (
                <div
                  aria-hidden="true"
                  className="mx-auto mb-2 h-px w-4 bg-border/70"
                />
              ) : (
                <button
                  type="button"
                  id={groupId}
                  aria-expanded={!groupCollapsed}
                  aria-controls={`${groupId}-items`}
                  onClick={() => toggleGroup(group.label!, groupCollapsed)}
                  className={cn(
                    "group/sidebar-section mb-1 flex min-h-9 w-full items-center justify-between rounded-lg px-3 py-2",
                    "text-xs font-semibold text-muted-foreground",
                    "transition-colors hover:bg-muted/70 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <span>{group.label}</span>

                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-3.5 text-muted-foreground transition-transform duration-200",
                      groupCollapsed && "-rotate-90",
                    )}
                  />
                </button>
              )
            ) : null}

            <div
              id={group.label ? `${groupId}-items` : undefined}
              className={cn(groupCollapsed && "hidden")}
            >
              <div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    const active = isNavigationItemActive(item, pathname);

                    return (
                      <div
                        className="group/navigation-item relative"
                        key={item.label}
                      >
                        {collapsed ? (
                          <RailTooltip label={item.label}>
                            <Link
                              href={item.href}
                              onClick={onNavigate}
                              aria-current={active ? "page" : undefined}
                              aria-label={item.label}
                              className={cn(
                                "relative flex min-h-10 items-center justify-center rounded-lg px-0 text-sm font-medium",
                                "transition-[background-color,color,padding,gap] duration-200",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                active
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-hover hover:text-foreground",
                              )}
                            >
                              <Icon
                                aria-hidden="true"
                                className={cn(
                                  "size-[1.125rem] shrink-0",
                                  active && "text-primary",
                                )}
                              />
                            </Link>
                          </RailTooltip>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                              "transition-[background-color,color,padding,gap] duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-hover hover:text-foreground",
                            )}
                          >
                            {active ? (
                              <span
                                aria-hidden="true"
                                className="absolute left-0 h-5 w-0.5 rounded-full bg-primary"
                              />
                            ) : null}

                            <Icon
                              aria-hidden="true"
                              className={cn(
                                "size-[1.125rem] shrink-0 transition-transform duration-200",
                                active && "text-primary",
                                "group-hover/navigation-item:scale-[1.03]",
                              )}
                            />

                            <span className="min-w-0 truncate">
                              {item.label}
                            </span>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </nav>
  );
}

function AccountNavigation({
  collapsed = false,
  email,
}: {
  collapsed?: boolean;
  email: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);

        requestAnimationFrame(() => {
          triggerRef.current?.focus();
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

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative border-t border-border",
        collapsed ? "px-2 py-3" : "px-3 py-3",
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Abrir opções da conta"
        title={collapsed ? email : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex w-full items-center rounded-lg transition-colors",
          "hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed ? "justify-center p-1" : "gap-3 px-2 py-1.5",
          isOpen && "bg-muted/70",
        )}
      >
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <UserRound className="size-[1.125rem]" />
        </div>

        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium" title={email}>
                {email}
              </p>

              <p className="text-xs text-muted-foreground">Conta Pulsa</p>
            </div>

            <Ellipsis
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </>
        ) : null}
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Opções da conta"
          className={cn(
            "absolute z-50 w-56 overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-lg",
            collapsed
              ? "bottom-3 left-[calc(100%+0.5rem)] origin-bottom-left"
              : "bottom-[calc(100%+0.5rem)] left-3 right-3 w-auto origin-bottom",
          )}
        >
          <div className="border-b border-border px-2.5 pb-2 pt-1">
            <p className="truncate text-sm font-medium" title={email}>
              {email}
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">Conta Pulsa</p>
          </div>

          <div className="pt-1.5">
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex min-h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="size-4 shrink-0" aria-hidden="true" />
                Sair
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DesktopNavigation({
  email,
  operationalContextState,
  showAdministration,
}: {
  email: string;
  operationalContextState: OperationalContextState;
  showAdministration: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("pulsa-sidebar-collapsed");

      setCollapsed(stored === "true");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;

      window.localStorage.setItem("pulsa-sidebar-collapsed", String(next));

      return next;
    });
  }

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "peer fixed left-0 top-0 z-40 hidden h-dvh min-h-screen flex-col border-r border-border bg-card lg:flex overflow-x-visible",
        "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-[4.25rem]" : "w-64",
      )}
    >
      <div
        className={cn(
          "relative flex h-16 shrink-0 items-center border-b border-border transition-[padding] duration-300",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <Link
          href="/app"
          aria-label="Ir para visão geral"
          className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark compact={collapsed} />
        </Link>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}
          title={collapsed ? "Expandir navegação" : "Recolher navegação"}
          className={cn(
            "absolute -right-3.5 top-1/2 z-20 size-7 -translate-y-1/2 rounded-full bg-card shadow-sm",
            "transition-[transform,background-color] duration-200",
            "hover:bg-hover",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-3.5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-3.5" aria-hidden="true" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          "shrink-0 border-b border-border transition-[padding] duration-300",
          collapsed ? "px-2 py-3" : "px-3 py-3",
        )}
      >
        <OperationalContextSwitcher
          state={operationalContextState}
          variant={collapsed ? "rail" : "inline"}
        />
      </div>

      <div className="shrink-0 border-b border-border px-3 py-3">
        <NavigationSearch collapsed={collapsed} shortcut showAdministration={showAdministration} />
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          className={cn(
            "h-full min-w-0 overflow-y-auto overflow-x-hidden py-4",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            collapsed ? "px-2" : "px-3",
          )}
        >
          <NavigationLinks
            collapsed={collapsed}
            showAdministration={showAdministration}
          />
        </div>

        <div
          aria-hidden="true"
          className="
      pointer-events-none
      absolute inset-x-0 bottom-0
      h-8
      bg-gradient-to-t
      from-card
      via-card/85
      to-transparent
    "
        />
      </div>

      <AccountNavigation collapsed={collapsed} email={email} />
    </aside>
  );
}

export function MobileNavigation({
  email,
  operationalContextState,
  showAdministration,
}: {
  email: string;
  operationalContextState: OperationalContextState;
  showAdministration: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuDialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = menuDialogRef.current;
    const menuButton = menuButtonRef.current;
    if (!dialog) return;
    dialog.showModal();
    closeButtonRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      menuButton?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          ref={menuButtonRef}
          type="button"
          variant="outline"
          size="sm"
          className="size-10 p-0"
          aria-label="Abrir menu de navegação"
          aria-expanded={isOpen}
          aria-controls="authenticated-navigation-drawer"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
        <NavigationSearch collapsed showAdministration={showAdministration} />
      </div>
      {isOpen ? (
        <dialog
          aria-label="Menu de navegação"
          className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-foreground/20 lg:hidden"
          onCancel={(event) => { event.preventDefault(); setIsOpen(false); }}
          onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}
          ref={menuDialogRef}
        >
          <aside
            id="authenticated-navigation-drawer"
            className="relative flex h-full w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-border bg-card shadow-lg"
          >
            <div className="flex h-16 items-center justify-between border-b px-5">
              <Link
                href="/app"
                onClick={() => setIsOpen(false)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BrandMark />
              </Link>
              <Button
                ref={closeButtonRef}
                type="button"
                variant="outline"
                size="sm"
                className="size-10 p-0"
                aria-label="Fechar menu de navegação"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>
            <div className="border-b px-3 py-3">
              <OperationalContextSwitcher state={operationalContextState} />
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <NavigationLinks
                showAdministration={showAdministration}
                onNavigate={() => setIsOpen(false)}
              />
            </div>
            <AccountNavigation email={email} />
          </aside>
        </dialog>
      ) : null}
    </>
  );
}
