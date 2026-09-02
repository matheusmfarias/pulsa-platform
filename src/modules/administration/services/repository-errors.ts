import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

type RepositoryError = { code: string; message?: string };

export function throwAdministrationRepositoryError(
  error: RepositoryError,
  operation: string,
): never {
  if (error.code === "42501") {
    throw new AppError(
      "AUTHORIZATION",
      "Você não possui permissão para administrar esta organização.",
    );
  }
  if (error.code === "P0002") {
    throw new AppError("NOT_FOUND", "Registro administrativo não encontrado.");
  }
  if (
    error.code === "P0001" &&
    error.message?.includes("at least one active DIRECTOR")
  ) {
    throw new AppError(
      "CONFLICT",
      "A organização deve manter pelo menos um Diretor ativo.",
    );
  }

  logger.error({
    event: "administration.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar a administração.");
}
