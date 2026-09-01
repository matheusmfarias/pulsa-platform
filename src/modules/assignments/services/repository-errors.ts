import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

type RepositoryError = { code: string };

export function throwAssignmentRepositoryError(
  error: RepositoryError,
  operation: string,
): never {
  if (error.code === "23P01") {
    throw new AppError(
      "CONFLICT",
      "O Worker já possui uma Assignment pending ou ativa nesse período.",
    );
  }
  if (["23503", "23514", "22023"].includes(error.code)) {
    throw new AppError(
      "VALIDATION",
      "Os dados da Assignment são incompatíveis com o Worker ou a Position informada.",
    );
  }
  logger.error({ event: "assignments.repository_failed", errorCode: error.code, operation });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar Assignments.");
}
