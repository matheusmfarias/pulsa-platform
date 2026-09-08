import { cache } from "react";

import { AppError } from "@/shared/errors";

import type { WorkerAccessContext } from "../domain/worker-access";
import { resolveWorkerAccessRecord } from "../repositories/worker-access-repository";
import { workerAccessContextRowSchema } from "../schemas/worker-access-schemas";
import { throwWorkerAccessRepositoryError } from "./repository-errors";

export const requireWorkerAccess = cache(
  async (): Promise<WorkerAccessContext> => {
    const { data, error } = await resolveWorkerAccessRecord();
    if (error) throwWorkerAccessRepositoryError(error, "resolve_worker_access");

    const parsed = workerAccessContextRowSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("AUTHORIZATION", "Acesso Worker indisponível.");
    }

    return {
      userId: parsed.data.user_id,
      workerId: parsed.data.worker_id,
      organizationId: parsed.data.organization_id,
      workerName: parsed.data.worker_name,
    };
  },
);

export async function getOptionalWorkerAccess(): Promise<WorkerAccessContext | null> {
  try {
    return await requireWorkerAccess();
  } catch (error) {
    if (error instanceof AppError && error.code === "AUTHORIZATION") return null;
    throw error;
  }
}
