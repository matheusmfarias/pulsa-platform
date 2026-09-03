import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import { OPERATION_STATUS_LABELS, type OperationStatus } from "../domain/operation";

const STATUS_PRESENTATION = {
  planning: { category: "neutral", label: OPERATION_STATUS_LABELS.planning },
  implementation: { category: "info", label: OPERATION_STATUS_LABELS.implementation },
  active: { category: "success", label: OPERATION_STATUS_LABELS.active },
  suspended: { category: "warning", label: OPERATION_STATUS_LABELS.suspended },
  closing: { category: "info", label: OPERATION_STATUS_LABELS.closing },
  closed: { category: "neutral", label: OPERATION_STATUS_LABELS.closed },
} satisfies StatusPresentationMap<OperationStatus>;

export function OperationStatusBadge({ status }: { status: OperationStatus }) {
  return <StatusBadge status={status} {...STATUS_PRESENTATION[status]} />;
}
