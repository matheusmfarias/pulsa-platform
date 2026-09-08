import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function shiftPresenceDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function PresenceDayNavigation({ date, today }: { date: string; today: string }) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild aria-label="Dia anterior" size="icon" variant="outline"><Link href={`/app/presences?date=${shiftPresenceDate(date, -1)}`}><ChevronLeft aria-hidden="true" className="size-4" /></Link></Button>
      <Button asChild size="sm" variant={date === today ? "default" : "outline"}><Link href={`/app/presences?date=${today}`}>Hoje</Link></Button>
      <Button asChild aria-label="Próximo dia" size="icon" variant="outline"><Link href={`/app/presences?date=${shiftPresenceDate(date, 1)}`}><ChevronRight aria-hidden="true" className="size-4" /></Link></Button>
      <p className="ml-1 text-sm font-medium capitalize">{formatted}</p>
    </div>
  );
}
