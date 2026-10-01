import { logger } from "./logger";

type StageResult = { error?: unknown };

/** Measures a fixed, non-sensitive server stage for production diagnostics. */
export async function measureServerStage<T>(
  operation: string,
  run: () => PromiseLike<T>,
): Promise<T> {
  const startedAt = performance.now();

  try {
    const result = await run();
    const hasReturnedError =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      Boolean((result as StageResult).error);

    logger.info({
      durationMs: Math.round(performance.now() - startedAt),
      event: "performance.server_stage",
      operation,
      outcome: hasReturnedError ? "error" : "success",
    });
    return result;
  } catch (error) {
    logger.info({
      durationMs: Math.round(performance.now() - startedAt),
      event: "performance.server_stage",
      operation,
      outcome: "error",
    });
    throw error;
  }
}
