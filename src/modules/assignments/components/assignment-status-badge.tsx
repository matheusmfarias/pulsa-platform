import { cn } from "@/shared/utils";

import { ASSIGNMENT_STATUS_LABELS, type AssignmentStatus } from "../domain/assignment";

const STYLES: Record<AssignmentStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  active: "bg-emerald-100 text-emerald-900",
  suspended: "bg-orange-100 text-orange-900",
  finished: "bg-slate-100 text-slate-800",
  cancelled: "bg-red-100 text-red-900",
};

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", STYLES[status])}>
      {ASSIGNMENT_STATUS_LABELS[status]}
    </span>
  );
}
