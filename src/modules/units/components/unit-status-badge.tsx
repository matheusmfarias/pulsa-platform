import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import { UNIT_STATUS_LABELS, type UnitStatus } from "../domain/unit";

const STATUS_PRESENTATION = {
  active: { category: "success", label: UNIT_STATUS_LABELS.active },
  inactive: { category: "neutral", label: UNIT_STATUS_LABELS.inactive },
} satisfies StatusPresentationMap<UnitStatus>;

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  return <StatusBadge status={status} {...STATUS_PRESENTATION[status]} />;
}
