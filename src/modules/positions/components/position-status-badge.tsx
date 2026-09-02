import {
  POSITION_STATUS_LABELS,
  type PositionStatus,
} from "../domain/position";
export function PositionStatusBadge({ status }: { status: PositionStatus }) {
  const style =
    status === "active"
      ? "border-success/25 bg-success/10 text-success"
      : "border-border bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {POSITION_STATUS_LABELS[status]}
    </span>
  );
}
