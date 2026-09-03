import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import { JOB_ROLE_STATUS_LABELS, type JobRoleStatus } from "../domain/job-role";

const STATUS_PRESENTATION = {
  active: { category: "success", label: JOB_ROLE_STATUS_LABELS.active },
  inactive: { category: "neutral", label: JOB_ROLE_STATUS_LABELS.inactive },
} satisfies StatusPresentationMap<JobRoleStatus>;

export function JobRoleStatusBadge({ status }: { status: JobRoleStatus }) {
  return <StatusBadge status={status} {...STATUS_PRESENTATION[status]} />;
}
