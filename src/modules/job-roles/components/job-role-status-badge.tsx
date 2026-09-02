import {
  JOB_ROLE_STATUS_LABELS,
  type JobRoleStatus,
} from "../domain/job-role";

export function JobRoleStatusBadge({ status }: { status: JobRoleStatus }) {
  const style = status === "active"
    ? "border-success/25 bg-success/10 text-success"
    : "border-border bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {JOB_ROLE_STATUS_LABELS[status]}
    </span>
  );
}
