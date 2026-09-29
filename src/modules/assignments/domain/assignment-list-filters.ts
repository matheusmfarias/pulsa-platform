import type { AssignmentListFilters } from "../schemas/assignment-schemas";

export function hasActiveAssignmentFilters(
  filters: AssignmentListFilters,
): boolean {
  return Boolean(filters.status || filters.query);
}
