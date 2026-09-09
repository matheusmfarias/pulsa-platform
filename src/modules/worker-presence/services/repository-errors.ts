import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

import type { WorkerPresenceRepositoryError } from "../repositories/worker-presence-repository";

export function throwWorkerPresenceRepositoryError(
  error: WorkerPresenceRepositoryError,
  operation: string,
): never {
  if (error.code === "42501") {
    throw new AppError("AUTHORIZATION", "Acesso Worker indisponível.");
  }
  if (error.code === "P0002") {
    throw new AppError(
      "CONFLICT",
      operation === "worker_start_presence"
        ? "Esta jornada não está disponível para registrar chegada."
        : "Não foi possível registrar a saída.",
    );
  }
  if (error.code === "22023") {
    throw new AppError("VALIDATION", "Comando de presença inválido.");
  }
  if (error.code === "23505" || error.code === "23514") {
    throw new AppError(
      "CONFLICT",
      "Sua jornada mudou. Atualize a página e tente novamente.",
    );
  }
  logger.error({
    event: "worker_presence.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao registrar a presença.");
}
