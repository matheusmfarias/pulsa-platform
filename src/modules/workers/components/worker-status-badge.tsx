import {
  WORKER_STATUS_LABELS,
  type WorkerStatus,
} from "../domain/worker";

const STATUS_STYLES: Record<WorkerStatus, string> = {
  onboarding: "border-info/25 bg-info/10 text-info",
  active: "border-success/25 bg-success/10 text-success",
  inactive: "border-border bg-muted text-muted-foreground",
  terminated: "border-danger/25 bg-danger/10 text-danger",
};

export function WorkerStatusBadge({ status }: { status: WorkerStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {WORKER_STATUS_LABELS[status]}
    </span>
  );
}
