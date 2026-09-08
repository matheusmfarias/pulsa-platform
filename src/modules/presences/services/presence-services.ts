import { requirePermission } from "@/modules/authorization";
import { AppError } from "@/shared/errors";
import type { OperationalContext } from "@/modules/operational-context";

import { presenceSchema, type Presence } from "../domain/presence";
import {
  operationalPresenceRowSchema,
  presenceOperationalDateSchema,
  type OperationalPresenceRow,
} from "../domain/operational-presence";
import {
  cancelPresenceRecord,
  completePresenceRecord,
  correctPresenceRecord,
  findPresenceById,
  findPresenceOperationalDay,
  findPresences,
  startPresenceRecord,
} from "../repositories/presence-repository";
import {
  cancelPresenceSchema,
  completePresenceSchema,
  correctPresenceSchema,
  presenceIdSchema,
  startPresenceSchema,
} from "../schemas/presence-schemas";
import { throwPresenceRepositoryError } from "./repository-errors";

export async function startPresence(input: unknown): Promise<Presence> {
  const validInput = startPresenceSchema.parse(input);
  const { organizationId } = await requirePermission("presence:create");
  const { data, error } = await startPresenceRecord(organizationId, validInput);
  if (error) throwPresenceRepositoryError(error, "start_presence");
  return presenceSchema.parse(data);
}

export async function completePresence(input: unknown): Promise<Presence> {
  const validInput = completePresenceSchema.parse(input);
  const { organizationId } = await requirePermission("presence:update");
  const { data, error } = await completePresenceRecord(organizationId, validInput);
  if (error) throwPresenceRepositoryError(error, "complete_presence");
  return presenceSchema.parse(data);
}

export async function correctPresence(input: unknown): Promise<Presence> {
  const validInput = correctPresenceSchema.parse(input);
  const { organizationId } = await requirePermission("presence:update");
  const { data, error } = await correctPresenceRecord(organizationId, validInput);
  if (error) throwPresenceRepositoryError(error, "correct_presence");
  return presenceSchema.parse(data);
}

export async function cancelPresence(input: unknown): Promise<Presence> {
  const validInput = cancelPresenceSchema.parse(input);
  const { organizationId } = await requirePermission("presence:cancel");
  const { data, error } = await cancelPresenceRecord(organizationId, validInput);
  if (error) throwPresenceRepositoryError(error, "cancel_presence");
  return presenceSchema.parse(data);
}

export async function getPresenceById(id: unknown): Promise<Presence> {
  const presenceId = presenceIdSchema.parse(id);
  const { organizationId } = await requirePermission("presence:read");
  const { data, error } = await findPresenceById(organizationId, presenceId);
  if (error) throwPresenceRepositoryError(error, "get_presence");
  if (!data) throw new AppError("NOT_FOUND", "Presença não encontrada.");
  return presenceSchema.parse(data);
}

export async function listPresences(): Promise<Presence[]> {
  const { organizationId } = await requirePermission("presence:read");
  const { data, error } = await findPresences(organizationId);
  if (error) throwPresenceRepositoryError(error, "list_presences");
  return (data ?? []).map((row) => presenceSchema.parse(row));
}

export async function listPresenceOperationalDay(
  date: unknown,
  operationalContext: OperationalContext,
): Promise<OperationalPresenceRow[]> {
  const validDate = presenceOperationalDateSchema.parse(date);
  const { organizationId } = await requirePermission("presence:read");
  const { data, error } = await findPresenceOperationalDay(
    organizationId,
    validDate,
    operationalContext,
  );
  if (error) throwPresenceRepositoryError(error, "list_presence_operational_day");
  return (data ?? []).map((row) => operationalPresenceRowSchema.parse(row));
}
