import { AppError } from "@/shared/errors";
import { logger } from "@/shared/logging";

type RepositoryError = { code?: string; message?: string };

export function throwSchedulingRepositoryError(error: RepositoryError, operation: string): never {
  const message = error.message ?? "";
  if (error.code === "42501") {
    throw new AppError("AUTHORIZATION", "Você não possui permissão para realizar esta ação na escala.");
  }
  if (error.code === "23P01") {
    throw new AppError("CONFLICT", message.includes("Worker")
      ? "O Worker possui horários sobrepostos em uma escala relevante."
      : "O período desta escala se sobrepõe a outra escala da mesma Operation.");
  }
  if (message.includes("immutable") || message.includes("only be changed in a draft")) {
    throw new AppError("CONFLICT", "A revisão publicada ou congelada não pode ser alterada.");
  }
  if (message.includes("Only ") || message.includes("Invalid ScheduleRevision status transition")) {
    throw new AppError("VALIDATION", "A transição de lifecycle da revisão não é permitida.");
  }
  if (message.includes("Assignment") || message.includes("ScheduleEntry is outside")) {
    throw new AppError("VALIDATION", "A Assignment é inválida, incompatível ou não cobre o período da entrada.");
  }
  if (error.code === "P0002") {
    throw new AppError("NOT_FOUND", "A escala ou revisão solicitada não foi encontrada.");
  }
  if (["23503", "23514", "22023"].includes(error.code ?? "")) {
    throw new AppError("VALIDATION", "Os dados informados para a escala são inválidos.");
  }
  logger.error({ event: "scheduling.repository_failed", errorCode: error.code, operation });
  throw new AppError("INFRASTRUCTURE", "Falha ao acessar Scheduling.");
}
