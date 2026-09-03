import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import {
  MEMBERSHIP_STATUS_LABELS,
  type MembershipStatus,
} from "../domain/organization-member";

const STATUS_PRESENTATION = {
  active: { category: "success", label: MEMBERSHIP_STATUS_LABELS.active },
  inactive: { category: "neutral", label: MEMBERSHIP_STATUS_LABELS.inactive },
} satisfies StatusPresentationMap<MembershipStatus>;

export function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  return <StatusBadge status={status} {...STATUS_PRESENTATION[status]} />;
}
