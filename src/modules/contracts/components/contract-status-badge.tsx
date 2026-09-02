import {
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
} from "../domain/contract";

const STATUS_STYLES: Record<ContractStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  active: "border-success/25 bg-success/10 text-success",
  suspended: "border-warning/25 bg-warning/10 text-warning",
  ended: "border-info/25 bg-info/10 text-info",
  cancelled: "border-border bg-muted text-muted-foreground",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {CONTRACT_STATUS_LABELS[status]}
    </span>
  );
}
