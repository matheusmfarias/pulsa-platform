import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

type RepositoryError = { code: string };

export function throwRepositoryError(
  error: RepositoryError,
  operation: string,
  duplicateMessage?: string,
): never {
  if (error.code === "23505" && duplicateMessage) {
    throw new AppError("CONFLICT", duplicateMessage);
  }

  logger.error({
    event: "clients.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar clientes.");
}
