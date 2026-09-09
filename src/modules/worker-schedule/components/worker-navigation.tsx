"use client";

import { CalendarDays, History, House, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/worker", label: "Hoje", icon: House },
  { href: "/worker/schedule", label: "Escala", icon: CalendarDays },
  { href: "/worker/history", label: "Histórico", icon: History },
  { href: "/worker/account", label: "Conta", icon: UserRound },
];

export function WorkerNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-16px_rgba(15,23,42,0.45)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:pb-0 sm:shadow-none"
    >
      <div className="mx-auto grid h-16 max-w-3xl grid-cols-4 sm:flex sm:h-auto sm:gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/worker" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm ${active ? "bg-hover text-action-primary" : "text-muted-foreground hover:bg-hover hover:text-foreground"}`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
