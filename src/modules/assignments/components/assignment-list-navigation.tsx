"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

type AssignmentNavigationMode = "push" | "replace";

type AssignmentListNavigationValue = {
  isPending: boolean;
  navigate: (href: string, mode?: AssignmentNavigationMode) => void;
};

const AssignmentListNavigationContext = React.createContext<AssignmentListNavigationValue | null>(null);

export function AssignmentListNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
    if (isTransitionPending) return;
    if (!isNavigationPending || pendingHrefRef.current) return;

    setIsNavigationPending(false);
  }, [isNavigationPending, isTransitionPending]);

  const navigate = React.useCallback(
    (href: string, mode: AssignmentNavigationMode = "push") => {
      const destination = new URL(href, window.location.origin);
      const normalizedHref = `${destination.pathname}${destination.search}`;
      const currentHref = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
      if (normalizedHref === currentHref) return;

      pendingHrefRef.current = normalizedHref;
      setIsNavigationPending(true);
      startTransition(() => {
        if (mode === "replace") {
          router.replace(normalizedHref, { scroll: false });
        } else {
          router.push(normalizedHref, { scroll: false });
        }
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  const value = React.useMemo(
    () => ({ isPending: isTransitionPending || isNavigationPending, navigate }),
    [isNavigationPending, isTransitionPending, navigate],
  );

  return (
    <AssignmentListNavigationContext.Provider value={value}>
      {children}
    </AssignmentListNavigationContext.Provider>
  );
}

export function useAssignmentListNavigation() {
  const context = React.useContext(AssignmentListNavigationContext);
  if (!context) {
    throw new Error("Assignment list navigation must be used within its provider.");
  }
  return context;
}

export function AssignmentPaginationNavigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const { navigate } = useAssignmentListNavigation();

  return (
    <div
      onClickCapture={(event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const anchor = target.closest("a");
        if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

        const destination = new URL(anchor.href, window.location.origin);
        if (
          destination.origin !== window.location.origin ||
          destination.pathname !== "/app/assignments"
        ) {
          return;
        }

        event.preventDefault();
        navigate(`${destination.pathname}${destination.search}`);
      }}
    >
      {children}
    </div>
  );
}

export function AssignmentTablePendingSurface({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPending } = useAssignmentListNavigation();

  return (
    <div
      aria-busy={isPending}
      className={`transition-opacity duration-200 ${isPending ? "opacity-55" : "opacity-100"}`}
    >
      {children}
    </div>
  );
}
