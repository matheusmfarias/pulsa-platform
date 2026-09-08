import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

type RepositoryError = { code?: string; message?: string };

export function throwReplacementRepositoryError(
  error: RepositoryError,
  operation: string,
): never {
  const message = error.message ?? "";
  if (error.code === "42501") {
    throw new AppError("AUTHORIZATION", "Você não possui permissão para realizar esta ação na substituição.");
  }
  if (error.code === "23505" || message.includes("active Replacement")) {
    throw new AppError("CONFLICT", "Esta ausência já possui uma substituição ativa.");
  }
  if (error.code === "23P01" || message.includes("conflict")) {
    throw new AppError("CONFLICT", "O colaborador possui conflito de horário na escala.");
  }
  if (error.code === "P0002") {
    throw new AppError("NOT_FOUND", "Ausência, substituição ou atribuição não encontrada.");
  }
  if (["23503", "23514", "22023"].includes(error.code ?? "")) {
    throw new AppError("VALIDATION", "O colaborador não é elegível para esta substituição.");
  }
  logger.error({ event: "replacement.repository_failed", errorCode: error.code, operation });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar Substituições.");
}
