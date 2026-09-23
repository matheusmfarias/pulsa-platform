import { StatusBadge, type StatusCategory } from "@/components/ui/status-badge";

import {
  WORKER_JOURNEY_SHORT_LABELS,
  type WorkerJourneyStatus,
} from "../domain/worker-schedule";

const categories: Record<WorkerJourneyStatus, StatusCategory> = {
  original_expected: "info",
  replacement_expected: "info",
  original_absent: "neutral",
  original_replaced: "neutral",
  in_progress: "success",
  completed: "success",
};

export function WorkerJourneyBadge({ status }: { status: WorkerJourneyStatus }) {
  return (
    <StatusBadge
      category={categories[status]}
      label={WORKER_JOURNEY_SHORT_LABELS[status]}
      status={status}
    />
  );
}
