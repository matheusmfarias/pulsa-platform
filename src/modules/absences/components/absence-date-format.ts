export function formatAbsenceJourney(
  startsAt: string,
  endsAt: string,
  timeZone: string,
): string {
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  });
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const startDate = date.format(start);
  const endDate = date.format(end);
  return startDate === endDate
    ? `${startDate} · ${time.format(start)}–${time.format(end)}`
    : `${startDate}, ${time.format(start)} – ${endDate}, ${time.format(end)}`;
}
