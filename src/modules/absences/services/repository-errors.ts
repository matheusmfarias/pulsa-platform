import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

type RepositoryError = { code?: string; message?: string };

export function throwAbsenceRepositoryError(
  error: RepositoryError,
  operation: string,
): never {
  const message = error.message ?? "";

  if (error.code === "42501") {
    throw new AppError(
      "AUTHORIZATION",
      "Você não possui permissão para realizar esta ação na ausência.",
    );
  }
  if (
    error.code === "23505" &&
    message.includes("absences_one_reported_per_schedule_entry_idx")
  ) {
    throw new AppError(
      "CONFLICT",
      "Esta entrada de escala já possui uma ausência ativa.",
    );
  }
  if (message.includes("Only a reported Absence can be cancelled")) {
    throw new AppError("CONFLICT", "A ausência já está cancelada.");
  }
  if (message.includes("Cancele a substituição ativa antes de cancelar a ausência.")) {
    throw new AppError(
      "CONFLICT",
      "Cancele a substituição ativa antes de cancelar a ausência.",
    );
  }
  if (error.code === "P0002") {
    throw new AppError("NOT_FOUND", "Ausência ou entrada de escala não encontrada.");
  }
  if (["23503", "23514", "22023"].includes(error.code ?? "")) {
    throw new AppError(
      "VALIDATION",
      "A ausência e a entrada de escala devem pertencer à mesma organização.",
    );
  }

  logger.error({
    event: "absence.repository_failed",
    errorCode: error.code,
    operation,
  });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar Ausências.");
}
