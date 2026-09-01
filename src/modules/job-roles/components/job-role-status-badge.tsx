import {
  JOB_ROLE_STATUS_LABELS,
  type JobRoleStatus,
} from "../domain/job-role";

export function JobRoleStatusBadge({ status }: { status: JobRoleStatus }) {
  const style = status === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-neutral-200 bg-neutral-100 text-neutral-600";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {JOB_ROLE_STATUS_LABELS[status]}
    </span>
  );
}
