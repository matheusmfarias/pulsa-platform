import { z } from "zod";

import { requirePermission } from "@/modules/authorization";

import { parseAssignmentWithContext, type AssignmentWithContext } from "../domain/assignment";
import { findAssignmentsForOperation } from "../repositories/assignment-repository";
import { throwAssignmentRepositoryError } from "./repository-errors";

export async function listAssignmentsForOperation(
  operationId: string,
): Promise<AssignmentWithContext[]> {
  await requirePermission("assignment:read");
  const { data, error } = await findAssignmentsForOperation(z.uuid().parse(operationId));
  if (error) throwAssignmentRepositoryError(error, "list_for_operation");
  return (data ?? []).map(parseAssignmentWithContext);
}
