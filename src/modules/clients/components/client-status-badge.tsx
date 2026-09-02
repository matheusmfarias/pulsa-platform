import { CLIENT_STATUS_LABELS, type ClientStatus } from "../domain/client";

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const style =
    status === "active"
      ? "border-success/25 bg-success/10 text-success"
      : "border-border bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {CLIENT_STATUS_LABELS[status]}
    </span>
  );
}
