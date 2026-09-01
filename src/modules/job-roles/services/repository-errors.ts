import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

export function throwJobRoleRepositoryError(
  error: { code?: string; message: string },
  operation: string,
): never {
  if (error.code === "23505") {
    throw new AppError("CONFLICT", "Já existe um cargo com este nome na organização.");
  }
  if (error.code === "23514" && error.message.includes("histórico")) {
    throw new AppError(
      "VALIDATION",
      "Não é possível renomear este cargo porque ele já possui histórico de alocações.",
    );
  }
  logger.error({
    event: "job_roles.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Não foi possível concluir a operação com o cargo.");
}
