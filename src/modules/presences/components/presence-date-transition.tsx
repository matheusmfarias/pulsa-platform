"use client";

import { createContext, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

function formatPresenceDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function presenceDateHref(date: string, preserveDiagnostics: boolean) {
  const params = new URLSearchParams({ date });
  if (preserveDiagnostics) params.set("perf", "1");
  return `/app/presences?${params.toString()}`;
}

type PresenceDateTransitionValue = {
  isPending: boolean;
  pendingDate: string | null;
  navigateToDate: (date: string) => void;
};

const PresenceDateTransitionContext = createContext<PresenceDateTransitionValue | null>(null);

export function PresenceDateTransitionProvider({
  children,
  date,
  preserveDiagnostics = false,
}: {
  children: ReactNode;
  date: string;
  preserveDiagnostics?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const activePendingDate = isPending && pendingDate !== date ? pendingDate : null;

  const value = useMemo<PresenceDateTransitionValue>(() => ({
    isPending: activePendingDate !== null,
    pendingDate: activePendingDate,
    navigateToDate: (nextDate) => {
      if (isPending || nextDate === date) return;
      setPendingDate(nextDate);
      startTransition(() => {
        router.push(presenceDateHref(nextDate, preserveDiagnostics), { scroll: false });
      });
    },
  }), [activePendingDate, date, isPending, preserveDiagnostics, router]);

  return (
    <PresenceDateTransitionContext.Provider value={value}>
      {children}
    </PresenceDateTransitionContext.Provider>
  );
}

export function usePresenceDateTransition() {
  const value = useContext(PresenceDateTransitionContext);
  if (!value) throw new Error("Presence date controls must be inside PresenceDateTransitionProvider.");
  return value;
}

function PresenceDaySkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-surface border border-border-default bg-border-default md:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => (
          <div className="min-h-[4.5rem] bg-surface px-4 py-3" key={item}>
            <div className="h-3 w-28 max-w-full rounded-control bg-subtle" />
            <div className="mt-2 h-6 w-10 rounded-control bg-subtle" />
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-surface border border-border-default bg-surface">
        <div className="border-b border-border-default px-4 py-4">
          <div className="h-4 w-48 max-w-full rounded-control bg-subtle" />
          <div className="mt-2 h-3 w-72 max-w-full rounded-control bg-subtle" />
        </div>
        <div className="divide-y divide-border-default">
          {[0, 1, 2, 3].map((item) => (
            <div className="grid min-h-[4.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_auto]" key={item}>
              <div>
                <div className="h-4 w-40 max-w-full rounded-control bg-subtle" />
                <div className="mt-2 h-3 w-28 max-w-full rounded-control bg-subtle" />
              </div>
              <div className="hidden h-4 w-28 rounded-control bg-subtle sm:block" />
              <div className="hidden h-4 w-32 rounded-control bg-subtle sm:block" />
              <div className="h-8 w-20 rounded-control bg-subtle" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PresenceDayLoadingRegion({ children }: { children: ReactNode }) {
  const { isPending } = usePresenceDateTransition();

  return (
    <div aria-busy={isPending} className="mt-5">
      {isPending ? <PresenceDaySkeleton /> : children}
    </div>
  );
}

export function PresenceDateLoadingStatus() {
  const { isPending, pendingDate } = usePresenceDateTransition();

  if (!isPending || !pendingDate) return <div aria-live="polite" className="min-h-8" />;

  return (
    <div aria-live="polite" className="flex min-h-8 items-center gap-2 text-sm text-muted-foreground" role="status">
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-action-primary" />
      <span>Carregando presença de {formatPresenceDate(pendingDate)}…</span>
    </div>
  );
}
