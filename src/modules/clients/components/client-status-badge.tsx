import { StatusBadge, type StatusPresentationMap } from "@/components/ui/status-badge";

import { CLIENT_STATUS_LABELS, type ClientStatus } from "../domain/client";

const STATUS_PRESENTATION = {
  active: { category: "success", label: CLIENT_STATUS_LABELS.active },
  inactive: { category: "neutral", label: CLIENT_STATUS_LABELS.inactive },
} satisfies StatusPresentationMap<ClientStatus>;

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <StatusBadge status={status} {...STATUS_PRESENTATION[status]} />;
}
