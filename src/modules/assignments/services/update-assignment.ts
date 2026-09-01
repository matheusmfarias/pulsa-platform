import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseAssignment, type Assignment } from "../domain/assignment";
import { updateAssignmentRecord } from "../repositories/assignment-repository";
import { assignmentIdSchema, assignmentInputSchema } from "../schemas/assignment-schemas";
import { getAssignmentById } from "./get-assignment-by-id";
import { throwAssignmentRepositoryError } from "./repository-errors";
import { validateAssignmentParents } from "./validate-assignment-parents";

export async function updateAssignment(id: unknown, input: unknown): Promise<Assignment> {
  await requirePermission("assignment:update");
  const assignmentId = assignmentIdSchema.parse(id);
  const validInput = assignmentInputSchema.parse(input);
  const [current, parents] = await Promise.all([
    getAssignmentById(assignmentId),
    validateAssignmentParents(validInput.worker_id, validInput.position_id),
  ]);
  if (validInput.worker_id !== current.worker_id && parents.worker.status !== "active") {
    throw new AppError("VALIDATION", "O novo Worker precisa estar ativo.");
  }
  if (
    validInput.position_id !== current.position_id &&
    parents.position.status !== "active"
  ) {
    throw new AppError("VALIDATION", "A nova Position precisa estar ativa.");
  }
  const { data, error } = await updateAssignmentRecord(assignmentId, validInput);
  if (error) throwAssignmentRepositoryError(error, "update");
  return parseAssignment(data);
}
