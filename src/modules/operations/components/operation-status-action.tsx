"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  changeOperationStatusAction,
  type OperationActionState,
} from "../actions";
import {
  OPERATION_STATUS_LABELS,
  OPERATION_STATUS_TRANSITIONS,
  type OperationStatus,
} from "../domain/operation";

const initialState: OperationActionState = { error: null };

function OperationTransitionButton({
  operationId,
  targetStatus,
}: {
  operationId: string;
  targetStatus: OperationStatus;
}) {
  const action = changeOperationStatusAction.bind(
    null,
    operationId,
    targetStatus,
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Atualizando…" : OPERATION_STATUS_LABELS[targetStatus]}
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

export function OperationStatusAction({
  operationId,
  currentStatus,
}: {
  operationId: string;
  currentStatus: OperationStatus;
}) {
  const transitions = OPERATION_STATUS_TRANSITIONS[currentStatus];

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este é um estado final e não possui novas transições.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((targetStatus) => (
        <OperationTransitionButton
          key={targetStatus}
          operationId={operationId}
          targetStatus={targetStatus}
        />
      ))}
    </div>
  );
}
