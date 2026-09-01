import {
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
} from "../domain/contract";

const STATUS_STYLES: Record<ContractStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  suspended: "border-amber-200 bg-amber-50 text-amber-700",
  ended: "border-blue-200 bg-blue-50 text-blue-700",
  cancelled: "border-neutral-200 bg-neutral-100 text-neutral-600",
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
