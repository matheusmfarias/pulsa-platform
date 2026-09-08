import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import { SCHEDULE_REVISION_STATUS_LABELS, type ScheduleRevisionStatus } from "../domain/scheduling";

const PRESENTATION = {
  draft: { category: "neutral", label: SCHEDULE_REVISION_STATUS_LABELS.draft },
  pending_approval: { category: "warning", label: SCHEDULE_REVISION_STATUS_LABELS.pending_approval },
  approved: { category: "info", label: SCHEDULE_REVISION_STATUS_LABELS.approved },
  published: { category: "success", label: SCHEDULE_REVISION_STATUS_LABELS.published },
} satisfies StatusPresentationMap<ScheduleRevisionStatus>;

export function ScheduleStatusBadge({ status }: { status: ScheduleRevisionStatus }) {
  return <StatusBadge status={status} {...PRESENTATION[status]} />;
}
