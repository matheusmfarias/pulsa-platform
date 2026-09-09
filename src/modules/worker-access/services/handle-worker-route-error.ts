import { redirect } from "next/navigation";

import { isAppError } from "@/shared/errors";

export function handleWorkerRouteError(error: unknown): never {
  if (isAppError(error) && error.code === "AUTHORIZATION") {
    redirect("/worker/claim");
  }

  throw error;
}

export async function withWorkerRouteAccess<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleWorkerRouteError(error);
  }
}
