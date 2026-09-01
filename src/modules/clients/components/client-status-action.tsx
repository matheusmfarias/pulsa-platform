"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  changeClientStatusAction,
  type ClientActionState,
} from "../actions";
import type { ClientStatus } from "../domain/client";

const initialState: ClientActionState = { error: null };

export function ClientStatusAction({
  clientId,
  currentStatus,
}: {
  clientId: string;
  currentStatus: ClientStatus;
}) {
  const targetStatus = currentStatus === "active" ? "inactive" : "active";
  const action = changeClientStatusAction.bind(null, clientId, targetStatus);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending
            ? "Atualizando…"
            : currentStatus === "active"
              ? "Desativar cliente"
              : "Ativar cliente"}
        </Button>
      </form>
      {state.error ? (
        <p className="mt-2 max-w-sm text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
