"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  changeMembershipStatusAction,
  type AdministrationActionState,
} from "../actions";
import type { MembershipStatus } from "../domain/organization-member";

const initialState: AdministrationActionState = { error: null };

export function MembershipStatusAction({
  profileId,
  currentStatus,
}: {
  profileId: string;
  currentStatus: MembershipStatus;
}) {
  const targetStatus = currentStatus === "active" ? "inactive" : "active";
  const action = changeMembershipStatusAction.bind(null, profileId, targetStatus);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending
            ? "Atualizando…"
            : currentStatus === "active"
              ? "Inativar membership"
              : "Ativar membership"}
        </Button>
      </form>
      {state.error ? <p className="mt-2 text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.success ? <p className="mt-2 text-sm text-emerald-700" role="status">{state.success}</p> : null}
    </div>
  );
}
