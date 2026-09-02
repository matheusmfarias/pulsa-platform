import { requirePermission } from "@/modules/authorization";

import {
  parseAssignmentWithContext,
  type AssignmentWithContext,
} from "../domain/assignment";
import { findActiveAssignmentsWithContext } from "../repositories/assignment-repository";
import { throwAssignmentRepositoryError } from "./repository-errors";

export async function listActiveAssignmentsWithContext(): Promise<
  AssignmentWithContext[]
> {
  await requirePermission("assignment:read");
  const { data, error } = await findActiveAssignmentsWithContext();
  if (error) throwAssignmentRepositoryError(error, "list_active_with_context");
  return (data ?? []).map(parseAssignmentWithContext);
}
