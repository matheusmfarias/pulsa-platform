"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PresenceDateLoadingStatus, usePresenceDateTransition } from "@/modules/presences/components/presence-date-transition";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2020, month, 1)),
  ),
);

function parseCivilDate(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

function formatCivilDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseCivilDate(date));
}

function civilDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

function shiftPresenceMonth(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 12));
}

export function shiftPresenceDate(date: string, days: number) {
  const value = parseCivilDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return civilDateKey(value);
}

function calendarDates(month: Date) {
  const first = monthStart(month);
  const firstVisible = new Date(first);
  firstVisible.setUTCDate(first.getUTCDate() - first.getUTCDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisible);
    date.setUTCDate(firstVisible.getUTCDate() + index);
    return date;
  });
}

export function PresenceDayNavigation({
  date,
  today,
}: {
  date: string;
  today: string;
}) {
  const { isPending, navigateToDate } = usePresenceDateTransition();
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(parseCivilDate(date)));
  const [focusedDate, setFocusedDate] = useState(date);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const dates = useMemo(() => calendarDates(visibleMonth), [visibleMonth]);
  const years = useMemo(() => {
    const currentYear = Number(today.slice(0, 4));
    const selectedYear = Number(date.slice(0, 4));
    return [...new Set([
      ...Array.from({ length: 16 }, (_, index) => currentYear - 10 + index),
      ...Array.from({ length: 5 }, (_, index) => selectedYear - 2 + index),
    ])].sort((left, right) => left - right);
  }, [date, today]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => dayRefs.current.get(focusedDate)?.focus());
  }, [focusedDate, open, visibleMonth]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !popoverRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const moveFocus = (days: number) => {
    const nextDate = shiftPresenceDate(focusedDate, days);
    const next = parseCivilDate(nextDate);
    setFocusedDate(nextDate);
    if (next.getUTCMonth() !== visibleMonth.getUTCMonth() || next.getUTCFullYear() !== visibleMonth.getUTCFullYear()) {
      setVisibleMonth(monthStart(next));
    }
    requestAnimationFrame(() => dayRefs.current.get(nextDate)?.focus());
  };

  const formattedDate = formatCivilDate(date);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
  }).format(visibleMonth);

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
      <div aria-label="Navegação diária" className="inline-flex items-center gap-1 rounded-control border border-border-default bg-surface p-1">
        <Button aria-label="Dia anterior" disabled={isPending} onClick={() => navigateToDate(shiftPresenceDate(date, -1))} size="icon" type="button" variant="ghost">
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>
        <Button disabled={isPending} onClick={() => navigateToDate(today)} size="sm" type="button" variant={date === today ? "default" : "outline"}>
          Hoje
        </Button>
        <Button aria-label="Próximo dia" disabled={isPending} onClick={() => navigateToDate(shiftPresenceDate(date, 1))} size="icon" type="button" variant="ghost">
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <div className="relative w-full sm:w-auto" ref={popoverRef}>
        <Button
          aria-expanded={open}
          aria-haspopup="dialog"
          className="h-11 w-full justify-between gap-2 sm:h-10 sm:w-auto sm:min-w-64"
          disabled={isPending}
          onClick={() => setOpen((value) => !value)}
          ref={triggerRef}
          type="button"
          variant="outline"
        >
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate capitalize">{formattedDate}</span>
          <ChevronDown aria-hidden="true" className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>

        {open ? (
          <div
            aria-label="Escolher data da presença"
            className="absolute left-0 top-full z-40 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-surface border border-border-default bg-surface p-3 shadow-lg sm:p-4"
            role="dialog"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <Button
                aria-label="Mês anterior"
                className="shrink-0"
                onClick={() => setVisibleMonth((value) => shiftPresenceMonth(value, -1))}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_6rem] gap-2">
                <Select
                  aria-label="Mês"
                  className="min-w-0 px-2 capitalize"
                  onValueChange={(nextValue) => setVisibleMonth((value) => new Date(Date.UTC(value.getUTCFullYear(), Number(nextValue), 1, 12)))}
                  value={String(visibleMonth.getUTCMonth())}
                >
                  {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
                </Select>
                <Select
                  aria-label="Ano"
                  className="min-w-0 px-2"
                  onValueChange={(nextValue) => setVisibleMonth((value) => new Date(Date.UTC(Number(nextValue), value.getUTCMonth(), 1, 12)))}
                  value={String(visibleMonth.getUTCFullYear())}
                >
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </Select>
              </div>
              <Button
                aria-label="Próximo mês"
                className="shrink-0"
                onClick={() => setVisibleMonth((value) => shiftPresenceMonth(value, 1))}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>

            <div aria-label={`${monthLabel} ${visibleMonth.getUTCFullYear()}`} className="space-y-1" role="grid">
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1" role="row">
                {WEEKDAYS.map((weekday, index) => (
                  <div aria-label={["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][index]} className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground" key={weekday + index} role="columnheader">
                    {weekday}
                  </div>
                ))}
              </div>
              {Array.from({ length: 6 }, (_, week) => (
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1" key={week} role="row">
                  {dates.slice(week * 7, week * 7 + 7).map((calendarDate) => {
                const key = civilDateKey(calendarDate);
                const isCurrentMonth = calendarDate.getUTCMonth() === visibleMonth.getUTCMonth();
                const isSelected = key === date;
                const isToday = key === today;
                return (
                  <div className="flex justify-center" key={key} role="gridcell">
                    <button
                      aria-current={isToday ? "date" : undefined}
                      aria-label={formatCivilDate(key)}
                      aria-pressed={isSelected}
                      className={`size-9 rounded-control text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${isSelected ? "bg-action-primary font-semibold text-primary-foreground" : "text-foreground hover:bg-hover"} ${!isCurrentMonth && !isSelected ? "text-muted-foreground/60" : ""} ${isToday && !isSelected ? "ring-1 ring-border-strong font-semibold" : ""}`}
                      disabled={isPending}
                      onClick={() => {
                        setOpen(false);
                        navigateToDate(key);
                      }}
                      onFocus={() => setFocusedDate(key)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowLeft") { event.preventDefault(); moveFocus(-1); }
                        if (event.key === "ArrowRight") { event.preventDefault(); moveFocus(1); }
                        if (event.key === "ArrowUp") { event.preventDefault(); moveFocus(-7); }
                        if (event.key === "ArrowDown") { event.preventDefault(); moveFocus(7); }
                        if (event.key === "PageUp") { event.preventDefault(); setVisibleMonth((value) => shiftPresenceMonth(value, -1)); }
                        if (event.key === "PageDown") { event.preventDefault(); setVisibleMonth((value) => shiftPresenceMonth(value, 1)); }
                      }}
                      ref={(element) => {
                        if (element) dayRefs.current.set(key, element);
                        else dayRefs.current.delete(key);
                      }}
                      tabIndex={key === focusedDate ? 0 : -1}
                      type="button"
                    >
                      {calendarDate.getUTCDate()}
                    </button>
                  </div>
                );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border-default pt-3">
              <p className="text-xs text-muted-foreground">Hoje: {new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" }).format(parseCivilDate(today))}</p>
              <Button disabled={isPending} onClick={() => {
                setOpen(false);
                navigateToDate(today);
              }} size="sm" type="button" variant="outline">Ir para hoje</Button>
            </div>
          </div>
        ) : null}
      </div>
      <PresenceDateLoadingStatus />
    </div>
  );
}
