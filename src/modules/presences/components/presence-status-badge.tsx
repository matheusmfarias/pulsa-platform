import { StatusBadge, type StatusCategory } from "@/components/ui/status-badge";

import type { OperationalPresenceStatus } from "../domain/operational-presence";

const PRESENTATION: Record<
  OperationalPresenceStatus,
  { category: StatusCategory; label: string }
> = {
  awaiting_confirmation: { category: "neutral", label: "Aguardando confirmação" },
  uncovered_absence: { category: "danger", label: "Ausente · sem cobertura" },
  replacement_expected: { category: "warning", label: "Substituto aguardado" },
  present: { category: "info", label: "Presente" },
  completed: { category: "success", label: "Concluído" },
};

export function PresenceStatusBadge({ status }: { status: OperationalPresenceStatus }) {
  const presentation = PRESENTATION[status];
  return <StatusBadge status={status} {...presentation} />;
}
