import { z } from "zod";

import type { Tables } from "@/shared/db/database.types";

export const workerStatusSchema = z.enum([
  "onboarding",
  "active",
  "inactive",
  "terminated",
]);

export type WorkerStatus = z.infer<typeof workerStatusSchema>;
export type Worker = Omit<Tables<"workers">, "status"> & {
  status: WorkerStatus;
};

export const WORKER_STATUS_LABELS: Record<WorkerStatus, string> = {
  onboarding: "Em onboarding",
  active: "Ativo",
  inactive: "Inativo",
  terminated: "Encerrado",
};

export const WORKER_STATUS_TRANSITIONS: Record<
  WorkerStatus,
  readonly WorkerStatus[]
> = {
  onboarding: ["active", "inactive"],
  active: ["inactive", "terminated"],
  inactive: ["active", "terminated"],
  terminated: [],
};

export function canTransitionWorkerStatus(
  currentStatus: WorkerStatus,
  targetStatus: WorkerStatus,
): boolean {
  return WORKER_STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
}

export function parseWorker(row: Tables<"workers">): Worker {
  return { ...row, status: workerStatusSchema.parse(row.status) };
}
