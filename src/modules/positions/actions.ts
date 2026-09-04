"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";
import { positionStatusSchema } from "./domain/position";
import {
  positionIdSchema,
  positionInputSchema,
} from "./schemas/position-schemas";
import { changePositionStatus } from "./services/change-position-status";
import { createPosition } from "./services/create-position";
import { updatePosition } from "./services/update-position";

type Field =
  "unit_id" | "job_role_id" | "description" | "base_required_headcount";
export type PositionActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<Field, string[]>>;
};
function readInput(formData: FormData) {
  return positionInputSchema.safeParse({
    unit_id: formData.get("unit_id"),
    job_role_id: formData.get("job_role_id"),
    description: formData.get("description"),
    base_required_headcount: formData.get("base_required_headcount"),
  });
}
function failure(error: unknown, operation: string): PositionActionState {
  if (!isAppError(error))
    logger.error({ event: "positions.action_failed", operation });
  return { error: toPublicErrorMessage(error) };
}

export async function createPositionAction(
  _state: PositionActionState,
  formData: FormData,
): Promise<PositionActionState> {
  const input = readInput(formData);
  if (!input.success)
    return {
      error: "Revise os campos informados.",
      fieldErrors: input.error.flatten().fieldErrors,
    };
  let position;
  try {
    position = await createPosition(input.data);
  } catch (error) {
    return failure(error, "create_position");
  }
  revalidatePath("/app/positions");
  revalidatePath(`/app/units/${position.unit_id}`);
  if (formData.get("redirect_to") === "position")
    redirect(`/app/positions/${position.id}`);
  redirect(`/app/units/${position.unit_id}`);
}
export async function updatePositionAction(
  positionId: string,
  _state: PositionActionState,
  formData: FormData,
): Promise<PositionActionState> {
  const id = positionIdSchema.safeParse(positionId);
  const input = readInput(formData);
  if (!id.success) return { error: id.error.issues[0].message };
  if (!input.success)
    return {
      error: "Revise os campos informados.",
      fieldErrors: input.error.flatten().fieldErrors,
    };
  let position;
  try {
    position = await updatePosition(id.data, input.data);
  } catch (error) {
    return failure(error, "update_position");
  }
  revalidatePath("/app/positions");
  revalidatePath(`/app/units/${position.unit_id}`);
  if (formData.get("redirect_to") === "position")
    redirect(`/app/positions/${position.id}`);
  redirect(`/app/units/${position.unit_id}`);
}
export async function changePositionStatusAction(
  positionId: string,
  targetStatus: string,
  _state: PositionActionState,
  formData: FormData,
): Promise<PositionActionState> {
  const input = z
    .object({ id: positionIdSchema, status: positionStatusSchema })
    .safeParse({ id: positionId, status: targetStatus });
  if (!input.success) return { error: "Ação de status inválida." };
  let position;
  try {
    position = await changePositionStatus(input.data.id, input.data.status);
  } catch (error) {
    return failure(error, "change_position_status");
  }
  revalidatePath("/app/positions");
  revalidatePath(`/app/units/${position.unit_id}`);
  if (formData.get("redirect_to") === "position")
    redirect(`/app/positions/${position.id}`);
  redirect(`/app/units/${position.unit_id}`);
}
