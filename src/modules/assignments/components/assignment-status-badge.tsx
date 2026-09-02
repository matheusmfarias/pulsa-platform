import { cn } from "@/shared/utils";

import { ASSIGNMENT_STATUS_LABELS, type AssignmentStatus } from "../domain/assignment";

const STYLES: Record<AssignmentStatus, string> = {
  pending: "border border-warning/25 bg-warning/10 text-warning",
  active: "border border-success/25 bg-success/10 text-success",
  suspended: "border border-warning/25 bg-warning/10 text-warning",
  finished: "border border-border bg-muted text-muted-foreground",
  cancelled: "border border-danger/25 bg-danger/10 text-danger",
};

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", STYLES[status])}>
      {ASSIGNMENT_STATUS_LABELS[status]}
    </span>
  );
}
