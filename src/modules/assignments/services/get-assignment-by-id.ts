import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import { parseAssignmentWithContext, type AssignmentWithContext } from "../domain/assignment";
import { findAssignmentById } from "../repositories/assignment-repository";
import { assignmentIdSchema } from "../schemas/assignment-schemas";
import { throwAssignmentRepositoryError } from "./repository-errors";

export async function getAssignmentById(id: unknown): Promise<AssignmentWithContext> {
  await requirePermission("assignment:read");
  const assignmentId = assignmentIdSchema.parse(id);
  const { data, error } = await findAssignmentById(assignmentId);
  if (error) throwAssignmentRepositoryError(error, "get");
  if (!data) throw new AppError("NOT_FOUND", "Assignment não encontrada.");
  return parseAssignmentWithContext(data);
}
