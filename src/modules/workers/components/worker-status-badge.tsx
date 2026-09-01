import {
  WORKER_STATUS_LABELS,
  type WorkerStatus,
} from "../domain/worker";

const STATUS_STYLES: Record<WorkerStatus, string> = {
  onboarding: "border-blue-200 bg-blue-50 text-blue-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-neutral-200 bg-neutral-100 text-neutral-600",
  terminated: "border-red-200 bg-red-50 text-red-700",
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
