"use client";

import { CalendarDays, History, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/worker", label: "Hoje", icon: House },
  { href: "/worker/schedule", label: "Escala", icon: CalendarDays },
  { href: "/worker/history", label: "Histórico", icon: History },
];

export function WorkerNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegação Worker" className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 backdrop-blur sm:static sm:border-0 sm:bg-transparent">
      <div className="mx-auto grid h-16 max-w-3xl grid-cols-3 sm:flex sm:h-auto sm:gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/worker" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium ${active ? "text-action-primary" : "text-muted-foreground hover:text-foreground"}`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
