import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import { WORKER_STATUS_LABELS, type WorkerStatus } from "../domain/worker";

const STATUS_PRESENTATION = {
  onboarding: { category: "info", label: WORKER_STATUS_LABELS.onboarding },
  active: { category: "success", label: WORKER_STATUS_LABELS.active },
  inactive: { category: "neutral", label: WORKER_STATUS_LABELS.inactive },
  terminated: { category: "danger", label: WORKER_STATUS_LABELS.terminated },
} satisfies StatusPresentationMap<WorkerStatus>;

export function WorkerStatusBadge({ status }: { status: WorkerStatus }) {
  return <StatusBadge status={status} {...STATUS_PRESENTATION[status]} />;
}
