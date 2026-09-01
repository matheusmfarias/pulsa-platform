import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

export function throwUnitRepositoryError(
  error: { code: string },
  operation: string,
): never {
  if (error.code === "23505") {
    throw new AppError(
      "CONFLICT",
      "Já existe uma unidade com este código na operação.",
    );
  }
  if (error.code === "23503" || error.code === "23514") {
    throw new AppError("VALIDATION", "Os dados da unidade são inválidos.");
  }
  logger.error({
    event: "units.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar unidades.");
}
