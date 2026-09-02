import { z } from "zod";

import { requirePermission } from "@/modules/authorization";

import { parseAssignmentWithContext, type AssignmentWithContext } from "../domain/assignment";
import { findAssignmentsForUnit } from "../repositories/assignment-repository";
import { throwAssignmentRepositoryError } from "./repository-errors";

export async function listAssignmentsForUnit(
  unitId: string,
): Promise<AssignmentWithContext[]> {
  await requirePermission("assignment:read");
  const { data, error } = await findAssignmentsForUnit(z.uuid().parse(unitId));
  if (error) throwAssignmentRepositoryError(error, "list_for_unit");
  return (data ?? []).map(parseAssignmentWithContext);
}
