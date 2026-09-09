import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

import type { WorkerScheduleRepositoryError } from "../repositories/worker-schedule-repository";

export function throwWorkerScheduleRepositoryError(
  error: WorkerScheduleRepositoryError,
  operation: string,
): never {
  if (error.code === "42501") {
    throw new AppError("AUTHORIZATION", "Acesso Worker indisponível.");
  }
  if (error.code === "P0002") {
    throw new AppError("NOT_FOUND", "Jornada não encontrada.");
  }
  if (error.code === "22023") {
    throw new AppError("VALIDATION", "Período da escala inválido.");
  }
  logger.error({
    event: "worker_schedule.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao consultar a escala Worker.");
}
