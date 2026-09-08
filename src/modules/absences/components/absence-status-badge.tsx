import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import type { AbsenceStatus } from "../domain/absence";

const statusPresentation = {
  reported: { label: "Registrada", category: "warning" },
  cancelled: { label: "Cancelada", category: "neutral" },
} satisfies StatusPresentationMap<AbsenceStatus>;

export function AbsenceStatusBadge({ status }: { status: AbsenceStatus }) {
  const presentation = statusPresentation[status];
  return <StatusBadge status={status} {...presentation} />;
}
