"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  changePositionStatusAction,
  type PositionActionState,
} from "../actions";
import type { PositionStatus } from "../domain/position";

const initialState: PositionActionState = { error: null };

export function PositionStatusAction({
  positionId,
  currentStatus,
  redirectToPosition = false,
}: {
  positionId: string;
  currentStatus: PositionStatus;
  redirectToPosition?: boolean;
}) {
  const target = currentStatus === "active" ? "inactive" : "active";
  const [state, action, pending] = useActionState(
    changePositionStatusAction.bind(null, positionId, target),
    initialState,
  );
  return (
    <div>
      <form action={action}>
        {redirectToPosition ? (
          <input type="hidden" name="redirect_to" value="position" />
        ) : null}
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending
            ? "Atualizando…"
            : target === "active"
              ? "Ativar posto"
              : "Desativar posto"}
        </Button>
      </form>
      {state.error ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
