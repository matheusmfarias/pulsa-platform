import { AppError } from "@/shared/errors";

import { findActiveManagerMembership } from "../repositories/operation-repository";
import { throwOperationRepositoryError } from "./repository-errors";

export async function validateOperationManager(
  organizationId: string,
  managerUserId: string | null,
): Promise<void> {
  if (!managerUserId) return;

  const { data, error } = await findActiveManagerMembership(
    organizationId,
    managerUserId,
  );

  if (error) {
    throwOperationRepositoryError(error, "validate_operation_manager");
  }

  if (!data) {
    throw new AppError(
      "VALIDATION",
      "O gestor deve possuir membership ativa na organização.",
    );
  }
}
