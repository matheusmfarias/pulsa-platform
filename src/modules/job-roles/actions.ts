"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAppError, toPublicErrorMessage } from "@/shared/errors";
import { logger } from "@/shared/logging";

import { jobRoleStatusSchema } from "./domain/job-role";
import { jobRoleIdSchema, jobRoleInputSchema } from "./schemas/job-role-schemas";
import { changeJobRoleStatus } from "./services/change-job-role-status";
import { createJobRole } from "./services/create-job-role";
import { updateJobRole } from "./services/update-job-role";

type Field = "name" | "description";
export type JobRoleActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<Field, string[]>>;
};

function readInput(formData: FormData) {
  return jobRoleInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
}

function failure(error: unknown, operation: string): JobRoleActionState {
  if (!isAppError(error)) logger.error({ event: "job_roles.action_failed", operation });
  return { error: toPublicErrorMessage(error) };
}

export async function createJobRoleAction(
  _state: JobRoleActionState,
  formData: FormData,
): Promise<JobRoleActionState> {
  const input = readInput(formData);
  if (!input.success) {
    return {
      error: "Revise os campos informados.",
      fieldErrors: input.error.flatten().fieldErrors,
    };
  }
  let jobRole;
  try {
    jobRole = await createJobRole(input.data);
  } catch (error) {
    return failure(error, "create_job_role");
  }
  revalidatePath("/app/job-roles");
  redirect(`/app/job-roles/${jobRole.id}`);
}

export async function updateJobRoleAction(
  jobRoleId: string,
  _state: JobRoleActionState,
  formData: FormData,
): Promise<JobRoleActionState> {
  const id = jobRoleIdSchema.safeParse(jobRoleId);
  const input = readInput(formData);
  if (!id.success) return { error: id.error.issues[0].message };
  if (!input.success) {
    return {
      error: "Revise os campos informados.",
      fieldErrors: input.error.flatten().fieldErrors,
    };
  }
  try {
    await updateJobRole(id.data, input.data);
  } catch (error) {
    return failure(error, "update_job_role");
  }
  revalidatePath("/app/job-roles");
  revalidatePath(`/app/job-roles/${id.data}`);
  redirect(`/app/job-roles/${id.data}`);
}

export async function changeJobRoleStatusAction(
  jobRoleId: string,
  targetStatus: string,
): Promise<JobRoleActionState> {
  const input = z
    .object({ id: jobRoleIdSchema, status: jobRoleStatusSchema })
    .safeParse({ id: jobRoleId, status: targetStatus });
  if (!input.success) return { error: "Ação de status inválida." };
  try {
    await changeJobRoleStatus(input.data.id, input.data.status);
  } catch (error) {
    return failure(error, "change_job_role_status");
  }
  revalidatePath("/app/job-roles");
  revalidatePath(`/app/job-roles/${input.data.id}`);
  redirect(`/app/job-roles/${input.data.id}`);
}
