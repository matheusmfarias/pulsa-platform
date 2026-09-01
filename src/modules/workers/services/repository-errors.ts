import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

export function throwWorkerRepositoryError(
  error: { code: string },
  operation: string,
): never {
  if (error.code === "23505") {
    throw new AppError(
      "CONFLICT",
      "Já existe um worker com este CPF na organização.",
    );
  }
  if (error.code === "23503" || error.code === "23514") {
    throw new AppError("VALIDATION", "Os dados do worker são inválidos.");
  }
  logger.error({
    event: "workers.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar workers.");
}
