import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import { ASSIGNMENT_STATUS_LABELS, type AssignmentStatus } from "../domain/assignment";

const STATUS_PRESENTATION = {
  pending: { category: "warning", label: ASSIGNMENT_STATUS_LABELS.pending },
  active: { category: "success", label: ASSIGNMENT_STATUS_LABELS.active },
  suspended: { category: "warning", label: ASSIGNMENT_STATUS_LABELS.suspended },
  finished: { category: "neutral", label: ASSIGNMENT_STATUS_LABELS.finished },
  cancelled: { category: "danger", label: ASSIGNMENT_STATUS_LABELS.cancelled },
} satisfies StatusPresentationMap<AssignmentStatus>;

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return <StatusBadge status={status} {...STATUS_PRESENTATION[status]} />;
}
