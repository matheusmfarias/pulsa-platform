import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

import type { WorkerAccessRepositoryError } from "../repositories/worker-access-repository";

export function throwWorkerAccessRepositoryError(
  error: WorkerAccessRepositoryError,
  operation: string,
): never {
  if (error.code === "42501") {
    throw new AppError("AUTHORIZATION", "Acesso Worker indisponível.");
  }
  if (error.code === "P0002") {
    throw new AppError("NOT_FOUND", "Acesso Worker não encontrado.");
  }
  if (error.code === "23505") {
    throw new AppError(
      "CONFLICT",
      "O Worker ou a conta já possui um acesso corrente.",
    );
  }
  if (error.code === "22023" || error.code === "23514") {
    throw new AppError("VALIDATION", "A alteração de acesso não é válida.");
  }

  logger.error({
    event: "worker_access.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar a identidade Worker.");
}
