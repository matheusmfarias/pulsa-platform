import { requirePermission } from "@/modules/authorization";

import {
  replacementCandidateSchema,
  replacementSchema,
  type Replacement,
  type ReplacementCandidate,
} from "../domain/replacement";
import {
  cancelReplacementRecord,
  findReplacementCandidates,
  insertReplacement,
} from "../repositories/replacement-repository";
import {
  absenceIdSchema,
  createReplacementSchema,
  replacementIdSchema,
} from "../schemas/replacement-schemas";
import { throwReplacementRepositoryError } from "./repository-errors";

export async function createReplacement(input: unknown): Promise<Replacement> {
  const validInput = createReplacementSchema.parse(input);
  const { organizationId } = await requirePermission("replacement:create");
  const { data, error } = await insertReplacement(
    organizationId,
    validInput.absence_id,
    validInput.assignment_id,
  );
  if (error) throwReplacementRepositoryError(error, "create_replacement");
  return replacementSchema.parse(data);
}

export async function cancelReplacement(id: unknown): Promise<Replacement> {
  const replacementId = replacementIdSchema.parse(id);
  const { organizationId } = await requirePermission("replacement:cancel");
  const { data, error } = await cancelReplacementRecord(organizationId, replacementId);
  if (error) throwReplacementRepositoryError(error, "cancel_replacement");
  return replacementSchema.parse(data);
}

export async function listReplacementCandidates(
  absenceId: unknown,
): Promise<ReplacementCandidate[]> {
  const validAbsenceId = absenceIdSchema.parse(absenceId);
  const { organizationId } = await requirePermission("replacement:create");
  const { data, error } = await findReplacementCandidates(organizationId, validAbsenceId);
  if (error) throwReplacementRepositoryError(error, "list_replacement_candidates");
  return (data ?? []).map((candidate) => replacementCandidateSchema.parse(candidate));
}
