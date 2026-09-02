import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import {
  parseAuditEvent,
  parseAuditEventDetail,
  type AuditEvent,
  type AuditEventDetail,
} from "../domain/audit-event";
import {
  findAuditEventById,
  findAuditEvents,
} from "../repositories/administration-repository";
import {
  AUDIT_PAGE_SIZE,
  type AuditListFilters,
} from "../schemas/administration-schemas";
import { throwAdministrationRepositoryError } from "./repository-errors";

export type PaginatedAuditEvents = {
  items: AuditEvent[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export async function listAuditEvents(
  filters: AuditListFilters,
): Promise<PaginatedAuditEvents> {
  const { organizationId } = await requirePermission("audit:read");
  const { data, error, count } = await findAuditEvents(organizationId, filters);
  if (error) throwAdministrationRepositoryError(error, "list_audit_events");
  const total = count ?? 0;
  return {
    items: data.map(parseAuditEvent),
    page: filters.page,
    pageSize: AUDIT_PAGE_SIZE,
    total,
    pageCount: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
  };
}

export async function getAuditEventById(
  auditEventId: string,
): Promise<AuditEventDetail> {
  const { organizationId } = await requirePermission("audit:read");
  const { data, error } = await findAuditEventById(organizationId, auditEventId);
  if (error) throwAdministrationRepositoryError(error, "get_audit_event");
  if (!data) throw new AppError("NOT_FOUND", "Evento de auditoria não encontrado.");
  return parseAuditEventDetail(data);
}
