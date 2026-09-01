import { CLIENT_STATUS_LABELS, type ClientStatus } from "../domain/client";

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const style =
    status === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-neutral-200 bg-neutral-100 text-neutral-600";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {CLIENT_STATUS_LABELS[status]}
    </span>
  );
}
