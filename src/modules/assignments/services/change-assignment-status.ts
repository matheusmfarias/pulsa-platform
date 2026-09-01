import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import {
  canTransitionAssignmentStatus,
  parseAssignment,
  type Assignment,
} from "../domain/assignment";
import { updateAssignmentStatus } from "../repositories/assignment-repository";
import { assignmentIdSchema } from "../schemas/assignment-schemas";
import { assignmentStatusSchema } from "../domain/assignment";
import { getAssignmentById } from "./get-assignment-by-id";
import { throwAssignmentRepositoryError } from "./repository-errors";

export async function changeAssignmentStatus(
  id: unknown,
  target: unknown,
): Promise<Assignment> {
  await requirePermission("assignment:update");
  const assignmentId = assignmentIdSchema.parse(id);
  const targetStatus = assignmentStatusSchema.parse(target);
  const current = await getAssignmentById(assignmentId);
  if (!canTransitionAssignmentStatus(current.status, targetStatus)) {
    throw new AppError("VALIDATION", "Transição de status inválida para a Assignment.");
  }
  const { data, error } = await updateAssignmentStatus(assignmentId, targetStatus);
  if (error) throwAssignmentRepositoryError(error, "status_change");
  return parseAssignment(data);
}
