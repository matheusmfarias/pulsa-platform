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
}: {
  positionId: string;
  currentStatus: PositionStatus;
}) {
  const target = currentStatus === "active" ? "inactive" : "active";
  const [state, action, pending] = useActionState(
    changePositionStatusAction.bind(null, positionId, target),
    initialState,
  );
  return (
    <div>
      <form action={action}>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending
            ? "Atualizando…"
            : target === "active"
              ? "Ativar"
              : "Desativar"}
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
