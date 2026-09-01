import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseAssignment, type Assignment } from "../domain/assignment";
import { insertAssignment } from "../repositories/assignment-repository";
import { assignmentInputSchema } from "../schemas/assignment-schemas";
import { throwAssignmentRepositoryError } from "./repository-errors";
import { validateAssignmentParents } from "./validate-assignment-parents";

export async function createAssignment(input: unknown): Promise<Assignment> {
  await requirePermission("assignment:create");
  const validInput = assignmentInputSchema.parse(input);
  const parents = await validateAssignmentParents(
    validInput.worker_id,
    validInput.position_id,
  );
  if (parents.worker.status !== "active") {
    throw new AppError("VALIDATION", "Uma nova Assignment exige um Worker ativo.");
  }
  if (parents.position.status !== "active") {
    throw new AppError("VALIDATION", "Uma nova Assignment exige uma Position ativa.");
  }
  const { data, error } = await insertAssignment(validInput);
  if (error) throwAssignmentRepositoryError(error, "create");
  return parseAssignment(data);
}
