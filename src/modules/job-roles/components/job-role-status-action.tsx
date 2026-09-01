"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  changeJobRoleStatusAction,
  type JobRoleActionState,
} from "../actions";
import type { JobRoleStatus } from "../domain/job-role";

const initialState: JobRoleActionState = { error: null };

export function JobRoleStatusAction({
  jobRoleId,
  currentStatus,
}: {
  jobRoleId: string;
  currentStatus: JobRoleStatus;
}) {
  const target = currentStatus === "active" ? "inactive" : "active";
  const action = changeJobRoleStatusAction.bind(null, jobRoleId, target);
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Atualizando…" : currentStatus === "active" ? "Inativar cargo" : "Ativar cargo"}
        </Button>
      </form>
      {state.error ? <p className="mt-2 text-sm text-destructive" role="alert">{state.error}</p> : null}
    </div>
  );
}
