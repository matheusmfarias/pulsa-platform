import { requirePermission } from "@/modules/authorization";

import { parseAssignmentWithContext, type AssignmentWithContext } from "../domain/assignment";
import { findAssignments } from "../repositories/assignment-repository";
import { assignmentListFiltersSchema } from "../schemas/assignment-schemas";
import { throwAssignmentRepositoryError } from "./repository-errors";

export async function listAssignments(filters: unknown = {}): Promise<AssignmentWithContext[]> {
  await requirePermission("assignment:read");
  const validFilters = assignmentListFiltersSchema.parse(filters);
  const { data, error } = await findAssignments(validFilters);
  if (error) throwAssignmentRepositoryError(error, "list");
  return (data ?? []).map(parseAssignmentWithContext);
}
