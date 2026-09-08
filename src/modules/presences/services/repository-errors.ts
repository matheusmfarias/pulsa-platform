import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

type RepositoryError = { code?: string; message?: string };

export function throwPresenceRepositoryError(
  error: RepositoryError,
  operation: string,
): never {
  const message = error.message ?? "";

  if (error.code === "42501") {
    throw new AppError(
      "AUTHORIZATION",
      "Você não possui permissão para realizar esta ação na presença.",
    );
  }
  if (
    error.code === "23505" ||
    message.includes("idempotency key") ||
    message.includes("one_current")
  ) {
    throw new AppError("CONFLICT", "O comando de presença conflita com um registro existente.");
  }
  if (error.code === "P0002") {
    throw new AppError("NOT_FOUND", "Presença ou entrada de escala não encontrada.");
  }
  if (
    message.includes("uncovered Absence") ||
    message.includes("current published ScheduleEntry") ||
    message.includes("actual Assignment") ||
    message.includes("Replacement context") ||
    message.includes("departed_at") ||
    message.includes("lifecycle") ||
    message.includes("immutable") ||
    ["23503", "23514", "22023"].includes(error.code ?? "")
  ) {
    throw new AppError("VALIDATION", message || "O registro de presença é inválido.");
  }

  logger.error({
    event: "presence.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar Presenças.");
}

