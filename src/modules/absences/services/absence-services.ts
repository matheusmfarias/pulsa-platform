import { requirePermission } from "@/modules/authorization";
import {
  ALL_OPERATIONAL_CONTEXT,
  type OperationalContext,
} from "@/modules/operational-context";
import { AppError } from "@/shared/errors";

import {
  absenceSchema,
  absenceWithContextSchema,
  type Absence,
  type AbsenceWithContext,
} from "../domain/absence";
import {
  cancelAbsenceRecord,
  findAbsenceById,
  findAbsenceDetailsById,
  findAbsences,
  insertAbsence,
} from "../repositories/absence-repository";
import {
  absenceIdSchema,
  createAbsenceSchema,
} from "../schemas/absence-schemas";
import { throwAbsenceRepositoryError } from "./repository-errors";

export async function createAbsence(input: unknown): Promise<Absence> {
  const validInput = createAbsenceSchema.parse(input);
  const { organizationId } = await requirePermission("absence:create");
  const { data, error } = await insertAbsence(organizationId, validInput);
  if (error) throwAbsenceRepositoryError(error, "create_absence");
  return absenceSchema.parse(data);
}

export async function cancelAbsence(id: unknown): Promise<Absence> {
  const absenceId = absenceIdSchema.parse(id);
  const { organizationId } = await requirePermission("absence:cancel");
  const { data, error } = await cancelAbsenceRecord(organizationId, absenceId);
  if (error) throwAbsenceRepositoryError(error, "cancel_absence");
  return absenceSchema.parse(data);
}

export async function getAbsenceById(id: unknown): Promise<Absence> {
  const absenceId = absenceIdSchema.parse(id);
  const { organizationId } = await requirePermission("absence:read");
  const { data, error } = await findAbsenceById(organizationId, absenceId);
  if (error) throwAbsenceRepositoryError(error, "get_absence");
  if (!data) throw new AppError("NOT_FOUND", "Ausência não encontrada.");
  return absenceSchema.parse(data);
}

export async function listAbsences(
  operationalContext: OperationalContext = ALL_OPERATIONAL_CONTEXT,
  options: { withoutCoverage?: boolean; limit?: number } = {},
): Promise<AbsenceWithContext[]> {
  const { organizationId } = await requirePermission("absence:read");
  const { data, error } = await findAbsences(organizationId, operationalContext, options);
  if (error) throwAbsenceRepositoryError(error, "list_absences");
  return (data ?? []).map((row) => absenceWithContextSchema.parse(row));
}

export async function getAbsenceDetailsById(
  id: unknown,
): Promise<AbsenceWithContext> {
  const absenceId = absenceIdSchema.parse(id);
  const { organizationId } = await requirePermission("absence:read");
  const { data, error } = await findAbsenceDetailsById(
    organizationId,
    absenceId,
  );
  if (error) throwAbsenceRepositoryError(error, "get_absence_details");
  if (!data) throw new AppError("NOT_FOUND", "Ausência não encontrada.");
  return absenceWithContextSchema.parse(data);
}
