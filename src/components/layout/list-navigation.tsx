"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { cn } from "@/shared/utils";

type NavigationMode = "push" | "replace";

type ListNavigationValue = {
  isPending: boolean;
  navigate: (href: string, mode?: NavigationMode) => void;
};

const ListNavigationContext = React.createContext<ListNavigationValue | null>(null);

export function ListNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isTransitionPending, startTransition] = React.useTransition();
  const [isNavigationPending, setIsNavigationPending] = React.useState(false);
  const pendingHrefRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const currentHref = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
    if (pendingHrefRef.current !== currentHref) return;

    pendingHrefRef.current = null;
    setIsNavigationPending(false);
  }, [pathname, searchParams]);

  React.useEffect(() => {
    if (isTransitionPending || !isNavigationPending || pendingHrefRef.current) return;
    setIsNavigationPending(false);
  }, [isNavigationPending, isTransitionPending]);

  const navigate = React.useCallback(
    (href: string, mode: NavigationMode = "push") => {
      const destination = new URL(href, window.location.origin);
      if (destination.origin !== window.location.origin) return;
      const normalizedHref = `${destination.pathname}${destination.search}`;
      const currentHref = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
      if (normalizedHref === currentHref) return;

      pendingHrefRef.current = normalizedHref;
      setIsNavigationPending(true);
      startTransition(() => {
        if (mode === "replace") router.replace(normalizedHref, { scroll: false });
        else router.push(normalizedHref, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const value = React.useMemo(
    () => ({ isPending: isTransitionPending || isNavigationPending, navigate }),
    [isNavigationPending, isTransitionPending, navigate],
  );

  return (
    <ListNavigationContext.Provider value={value}>
      <div
        className="contents"
        onClickCapture={(event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const anchor = target.closest("a");
          if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

          const destination = new URL(anchor.href, window.location.origin);
          const currentHref = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
          const destinationHref = `${destination.pathname}${destination.search}`;
          if (
            destination.origin !== window.location.origin ||
            destination.pathname !== pathname ||
            destinationHref === currentHref
          ) return;

          event.preventDefault();
          navigate(destinationHref);
        }}
      >
        {children}
      </div>
    </ListNavigationContext.Provider>
  );
}

export function useListNavigation() {
  const context = React.useContext(ListNavigationContext);
  if (!context) throw new Error("List navigation must be used within its provider.");
  return context;
}

export function ListPendingSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isPending } = useListNavigation();
  return (
    <div
      aria-busy={isPending}
      className={cn("transition-opacity duration-200", isPending ? "opacity-55" : "opacity-100", className)}
    >
      {children}
    </div>
  );
}

