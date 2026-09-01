import {
  OPERATION_STATUS_LABELS,
  type OperationStatus,
} from "../domain/operation";

const STATUS_STYLES: Record<OperationStatus, string> = {
  planning: "border-slate-200 bg-slate-50 text-slate-700",
  implementation: "border-violet-200 bg-violet-50 text-violet-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  suspended: "border-amber-200 bg-amber-50 text-amber-700",
  closing: "border-blue-200 bg-blue-50 text-blue-700",
  closed: "border-neutral-200 bg-neutral-100 text-neutral-600",
};

export function OperationStatusBadge({ status }: { status: OperationStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {OPERATION_STATUS_LABELS[status]}
    </span>
  );
}
