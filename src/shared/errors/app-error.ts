export const APP_ERROR_CODES = [
  "VALIDATION",
  "AUTHORIZATION",
  "NOT_FOUND",
  "CONFLICT",
  "INFRASTRUCTURE",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toPublicErrorMessage(error: unknown): string {
  if (isAppError(error) && error.code !== "INFRASTRUCTURE") {
    return error.message;
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}
