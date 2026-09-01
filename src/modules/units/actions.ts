"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { unitStatusSchema } from "./domain/unit";
import { unitIdSchema, unitInputSchema } from "./schemas/unit-schemas";
import { changeUnitStatus } from "./services/change-unit-status";
import { createUnit } from "./services/create-unit";
import { updateUnit } from "./services/update-unit";

type UnitField =
  "operation_id" | "name" | "code" | "address" | "city" | "state" | "timezone";
export type UnitActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<UnitField, string[]>>;
};

function readInput(formData: FormData) {
  return unitInputSchema.safeParse(
    Object.fromEntries(
      [
        "operation_id",
        "name",
        "code",
        "address",
        "city",
        "state",
        "timezone",
      ].map((key) => [key, formData.get(key)]),
    ),
  );
}

function failure(error: unknown, operation: string): UnitActionState {
  if (!isAppError(error))
    logger.error({ event: "units.action_failed", operation });
  return { error: toPublicErrorMessage(error) };
}

export async function createUnitAction(
  _state: UnitActionState,
  formData: FormData,
): Promise<UnitActionState> {
  const input = readInput(formData);
  if (!input.success)
    return {
      error: "Revise os campos informados.",
      fieldErrors: input.error.flatten().fieldErrors,
    };
  let unit;
  try {
    unit = await createUnit(input.data);
  } catch (error) {
    return failure(error, "create_unit");
  }
  revalidatePath("/app/units");
  revalidatePath(`/app/operations/${unit.operation_id}`);
  redirect(`/app/units/${unit.id}`);
}

export async function updateUnitAction(
  unitId: string,
  _state: UnitActionState,
  formData: FormData,
): Promise<UnitActionState> {
  const id = unitIdSchema.safeParse(unitId);
  const input = readInput(formData);
  if (!id.success) return { error: id.error.issues[0].message };
  if (!input.success)
    return {
      error: "Revise os campos informados.",
      fieldErrors: input.error.flatten().fieldErrors,
    };
  let unit;
  try {
    unit = await updateUnit(id.data, input.data);
  } catch (error) {
    return failure(error, "update_unit");
  }
  revalidatePath("/app/units");
  revalidatePath(`/app/units/${id.data}`);
  revalidatePath(`/app/operations/${unit.operation_id}`);
  redirect(`/app/units/${id.data}`);
}

export async function changeUnitStatusAction(
  unitId: string,
  targetStatus: string,
): Promise<UnitActionState> {
  const input = z
    .object({ id: unitIdSchema, status: unitStatusSchema })
    .safeParse({ id: unitId, status: targetStatus });
  if (!input.success) return { error: "Ação de status inválida." };
  let unit;
  try {
    unit = await changeUnitStatus(input.data.id, input.data.status);
  } catch (error) {
    return failure(error, "change_unit_status");
  }
  revalidatePath("/app/units");
  revalidatePath(`/app/units/${unit.id}`);
  revalidatePath(`/app/operations/${unit.operation_id}`);
  redirect(`/app/units/${unit.id}`);
}
