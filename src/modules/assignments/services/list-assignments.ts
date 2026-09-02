import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";

import { parseAssignmentWithContext, type AssignmentWithContext } from "../domain/assignment";
import { findAssignments } from "../repositories/assignment-repository";
import { assignmentListFiltersSchema } from "../schemas/assignment-schemas";
import { throwAssignmentRepositoryError } from "./repository-errors";

export async function listAssignments(
  filters: unknown = {},
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<AssignmentWithContext[]> {
  await requirePermission("assignment:read");
  const validFilters = assignmentListFiltersSchema.parse(filters);
  const { data, error } = await findAssignments(
    validFilters,
    operationalContext,
  );
  if (error) throwAssignmentRepositoryError(error, "list");
  return (data ?? []).map(parseAssignmentWithContext);
}
