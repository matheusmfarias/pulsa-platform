import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import { CONTRACT_STATUS_LABELS, type ContractStatus } from "../domain/contract";

const STATUS_PRESENTATION = {
  draft: { category: "neutral", label: CONTRACT_STATUS_LABELS.draft },
  active: { category: "success", label: CONTRACT_STATUS_LABELS.active },
  suspended: { category: "warning", label: CONTRACT_STATUS_LABELS.suspended },
  ended: { category: "info", label: CONTRACT_STATUS_LABELS.ended },
  cancelled: { category: "neutral", label: CONTRACT_STATUS_LABELS.cancelled },
} satisfies StatusPresentationMap<ContractStatus>;

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return <StatusBadge status={status} {...STATUS_PRESENTATION[status]} />;
}
