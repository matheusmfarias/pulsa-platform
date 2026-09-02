import {
  OPERATION_STATUS_LABELS,
  type OperationStatus,
} from "../domain/operation";

const STATUS_STYLES: Record<OperationStatus, string> = {
  planning: "border-border bg-muted text-muted-foreground",
  implementation: "border-info/25 bg-info/10 text-info",
  active: "border-success/25 bg-success/10 text-success",
  suspended: "border-warning/25 bg-warning/10 text-warning",
  closing: "border-info/25 bg-info/10 text-info",
  closed: "border-border bg-muted text-muted-foreground",
};

export function OperationStatusBadge({ status }: { status: OperationStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {OPERATION_STATUS_LABELS[status]}
    </span>
  );
}
