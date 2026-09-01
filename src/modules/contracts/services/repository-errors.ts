import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

type RepositoryError = { code: string };

export function throwContractRepositoryError(
  error: RepositoryError,
  operation: string,
): never {
  if (error.code === "23503") {
    throw new AppError("VALIDATION", "O cliente informado não está disponível.");
  }

  if (error.code === "23514") {
    throw new AppError("VALIDATION", "Os dados do contrato são inválidos.");
  }

  logger.error({
    event: "contracts.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar contratos.");
}
