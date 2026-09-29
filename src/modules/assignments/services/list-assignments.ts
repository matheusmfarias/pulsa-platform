import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";

import {
  parseAssignmentListItem,
  parseAssignmentWithContext,
  type AssignmentWithContext,
} from "../domain/assignment";
import { findAssignments, findAssignmentsPage } from "../repositories/assignment-repository";
import { assignmentListFiltersSchema } from "../schemas/assignment-schemas";
import { throwAssignmentRepositoryError } from "./repository-errors";

export const ASSIGNMENT_LIST_PAGE_SIZE = 10;

export async function listAssignmentsPage(
  filters: unknown = {},
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
  page = 1,
) {
  await requirePermission("assignment:read");
  const validFilters = assignmentListFiltersSchema.parse(filters);
  const { data, error, count } = await findAssignmentsPage(
    validFilters,
    operationalContext,
    page,
    validFilters.pageSize,
  );
  if (error) throwAssignmentRepositoryError(error, "list");
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / validFilters.pageSize));
  const effectivePage = Math.min(page, pageCount);
  let pageData = data ?? [];
  if (effectivePage !== page) {
    const corrected = await findAssignmentsPage(
      validFilters,
      operationalContext,
      effectivePage,
      validFilters.pageSize,
    );
    if (corrected.error) throwAssignmentRepositoryError(corrected.error, "list");
    pageData = corrected.data ?? [];
  }
  return {
    items: pageData.map(parseAssignmentListItem),
    page: effectivePage,
    pageSize: validFilters.pageSize,
    total,
    pageCount,
  };
}

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
