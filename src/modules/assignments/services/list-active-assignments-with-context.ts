import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";

import {
  parseAssignmentWithContext,
  type AssignmentWithContext,
} from "../domain/assignment";
import { findActiveAssignmentsWithContext } from "../repositories/assignment-repository";
import { throwAssignmentRepositoryError } from "./repository-errors";

export async function listActiveAssignmentsWithContext(
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
): Promise<
  AssignmentWithContext[]
> {
  await requirePermission("assignment:read");
  const { data, error } = await findActiveAssignmentsWithContext(
    operationalContext,
  );
  if (error) throwAssignmentRepositoryError(error, "list_active_with_context");
  return (data ?? []).map(parseAssignmentWithContext);
}
