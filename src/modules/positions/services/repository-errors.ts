import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";
export function throwPositionRepositoryError(
  error: { code?: string; message: string },
  operation: string,
): never {
  if (error.code === "23514" && error.message.includes("histórico"))
    throw new AppError("VALIDATION", error.message);
  if (error.code === "23503" || error.code === "23514")
    throw new AppError("VALIDATION", "Os dados da posição não são válidos.");
  logger.error({ event: "positions.repository_failed", operation });
  throw new AppError("INFRASTRUCTURE", "Não foi possível concluir a operação.");
}
