import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

type RepositoryError = { code: string };

export function throwOperationRepositoryError(
  error: RepositoryError,
  operation: string,
): never {
  if (error.code === "23503") {
    throw new AppError(
      "VALIDATION",
      "O contrato ou gestor informado não está disponível.",
    );
  }

  if (error.code === "23514") {
    throw new AppError("VALIDATION", "Os dados da operação são inválidos.");
  }

  logger.error({
    event: "operations.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar operações.");
}
