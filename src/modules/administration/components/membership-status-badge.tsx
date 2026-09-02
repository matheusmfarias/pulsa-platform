import { cn } from "@/shared/utils";

import {
  MEMBERSHIP_STATUS_LABELS,
  type MembershipStatus,
} from "../domain/organization-member";

export function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        status === "active"
          ? "border border-success/25 bg-success/10 text-success"
          : "border border-border bg-muted text-muted-foreground",
      )}
    >
      {MEMBERSHIP_STATUS_LABELS[status]}
    </span>
  );
}
