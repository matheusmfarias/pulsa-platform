"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { DataRouteSkeleton } from "@/components/ui/data-route-skeleton";

type PendingRoute = { pathname: string; label: string };

function skeletonKind(pathname: string) {
  if (pathname === "/app") return "dashboard" as const;
  if (pathname.endsWith("/new") || pathname.endsWith("/edit")) return "form" as const;
  if (/^\/app\/scheduling\/[^/]+$/.test(pathname)) return "schedule" as const;
  if (pathname.split("/").filter(Boolean).length > 2) return "detail" as const;
  return "collection" as const;
}

/** Shows a local fallback even while a cold dev route is still compiling. */
export function CoreRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingRoute | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute("download")) return;

      const destination = new URL(link.href);
      if (
        destination.origin !== window.location.origin ||
        (destination.pathname !== "/app" && !destination.pathname.startsWith("/app/"))
      ) return;
      if (destination.pathname === window.location.pathname) {
        setPending(null);
        return;
      }

      setPending({ pathname: destination.pathname, label: `Carregando ${link.textContent?.trim() || "página"}` });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPending(null));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setPending(null), 15_000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  return pending ? (
    <DataRouteSkeleton kind={skeletonKind(pending.pathname)} label={pending.label} />
  ) : children;
}
