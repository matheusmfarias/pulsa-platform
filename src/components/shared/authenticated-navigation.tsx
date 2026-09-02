"use client";

import {
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ScrollText,
  Tags,
  UserCog,
  UserRound,
  UserRoundCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { OperationalContextSwitcher } from "@/components/shared/operational-context-switcher";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/modules/auth/actions";
import type { OperationalContextState } from "@/modules/operational-context/domain/operational-context";
import { cn } from "@/shared/utils";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  matches?: (pathname: string) => boolean;
};

type NavigationGroup = { items: NavigationItem[]; label?: string };

const matchesResource = (href: string) => (pathname: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const authenticatedNavigation: NavigationGroup[] = [
  { items: [{ href: "/app", icon: LayoutDashboard, label: "Visão geral", matches: (pathname) => pathname === "/app" }] },
  {
    label: "Comercial",
    items: [
      { href: "/app/clients", icon: Building2, label: "Clientes", matches: matchesResource("/app/clients") },
      { href: "/app/contracts", icon: FileText, label: "Contratos", matches: matchesResource("/app/contracts") },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/app/operations", icon: BriefcaseBusiness, label: "Operações", matches: matchesResource("/app/operations") },
      {
        href: "/app/units",
        icon: MapPin,
        label: "Unidades",
        matches: (pathname) => (pathname === "/app/units" || /^\/app\/units\/[^/]+(?:\/edit)?$/.test(pathname)) && !pathname.includes("/positions"),
      },
      { href: "/app/job-roles", icon: Tags, label: "Cargos", matches: matchesResource("/app/job-roles") },
      {
        href: "/app/positions",
        icon: BriefcaseBusiness,
        label: "Postos",
        matches: (pathname) =>
          pathname === "/app/positions" ||
          /^\/app\/units\/[^/]+\/positions(?:\/|$)/.test(pathname),
      },
      { href: "/app/assignments", icon: UserRoundCheck, label: "Alocações", matches: matchesResource("/app/assignments") },
    ],
  },
  { label: "Pessoas", items: [{ href: "/app/workers", icon: Users, label: "Colaboradores", matches: matchesResource("/app/workers") }] },
];

const administrationNavigation: NavigationGroup = {
  label: "Administração",
  items: [
    { href: "/app/admin/users", icon: UserCog, label: "Usuários", matches: matchesResource("/app/admin/users") },
    { href: "/app/admin/audit", icon: ScrollText, label: "Auditoria", matches: matchesResource("/app/admin/audit") },
  ],
};

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  return item.matches?.(pathname) ?? pathname === item.href;
}

function NavigationLinks({
  onNavigate,
  showAdministration,
}: {
  onNavigate?: () => void;
  showAdministration: boolean;
}) {
  const pathname = usePathname() ?? "/app";
  const navigation = showAdministration
    ? [...authenticatedNavigation, administrationNavigation]
    : authenticatedNavigation;

  return (
    <nav aria-label="Navegação principal" className="space-y-7">
      {navigation.map((group, groupIndex) => (
        <section key={group.label ?? "overview"} aria-labelledby={group.label ? `navigation-group-${groupIndex}` : undefined}>
          {group.label ? <h2 id={`navigation-group-${groupIndex}`} className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{group.label}</h2> : null}
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isNavigationItemActive(item, pathname);
              return (
                <Link key={item.label} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                  className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-hover hover:text-foreground")}>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function AccountNavigation({ email }: { email: string }) {
  return (
    <div className="border-t border-border px-3 py-4">
      <div className="flex min-w-0 items-start gap-3 px-2">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-hover text-primary" aria-hidden="true">
          <UserRound className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={email}>{email}</p>
          <form action={logoutAction} className="mt-1">
            <Button type="submit" variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </Button>
          </form>
        </div>
      </div>
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
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh min-h-screen w-64 flex-col border-r border-border bg-card lg:flex">
      <Link href="/app" className="flex h-16 items-center border-b px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
        <BrandMark />
      </Link>
      <div className="border-b px-3 py-3"><OperationalContextSwitcher state={operationalContextState} /></div>
      <div className="flex-1 overflow-y-auto px-3 py-5"><NavigationLinks showAdministration={showAdministration} /></div>
      <AccountNavigation email={email} />
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="size-10 p-0 lg:hidden" aria-label="Abrir menu de navegação" aria-expanded={isOpen} aria-controls="authenticated-navigation-drawer" onClick={() => setIsOpen(true)}>
        <Menu className="size-5" aria-hidden="true" />
      </Button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-foreground/20" aria-label="Fechar menu de navegação" onClick={() => setIsOpen(false)} />
          <aside id="authenticated-navigation-drawer" role="dialog" aria-modal="true" aria-label="Menu de navegação" className="relative flex h-full w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-border bg-card shadow-lg">
            <div className="flex h-16 items-center justify-between border-b px-5">
              <Link href="/app" onClick={() => setIsOpen(false)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><BrandMark /></Link>
              <Button ref={closeButtonRef} type="button" variant="outline" size="sm" className="size-10 p-0" aria-label="Fechar menu de navegação" onClick={() => setIsOpen(false)}><X className="size-5" aria-hidden="true" /></Button>
            </div>
            <div className="border-b px-3 py-3"><OperationalContextSwitcher state={operationalContextState} /></div>
            <div className="flex-1 overflow-y-auto px-3 py-5"><NavigationLinks showAdministration={showAdministration} onNavigate={() => setIsOpen(false)} /></div>
            <AccountNavigation email={email} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
