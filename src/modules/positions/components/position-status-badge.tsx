import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import {
  POSITION_STATUS_LABELS,
  type PositionStatus,
} from "../domain/position";

const STATUS_PRESENTATION = {
  active: { category: "success", label: POSITION_STATUS_LABELS.active },
  inactive: { category: "neutral", label: POSITION_STATUS_LABELS.inactive },
} satisfies StatusPresentationMap<PositionStatus>;

export function PositionStatusBadge({ status }: { status: PositionStatus }) {
  return <StatusBadge status={status} {...STATUS_PRESENTATION[status]} />;
}
