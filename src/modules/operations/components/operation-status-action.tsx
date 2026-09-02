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

function transitionActionLabel(
  currentStatus: OperationStatus,
  targetStatus: OperationStatus,
): string {
  if (currentStatus === "planning" && targetStatus === "implementation") return "Avançar para implantação";
  if (currentStatus === "suspended" && targetStatus === "active") return "Reativar operação";
  if (currentStatus === "closing" && targetStatus === "active") return "Retomar operação";
  if (targetStatus === "active") return "Ativar operação";
  if (targetStatus === "suspended") return "Suspender operação";
  if (targetStatus === "closing") return "Iniciar encerramento";
  if (targetStatus === "closed") return "Encerrar operação";
  return `Alterar para ${OPERATION_STATUS_LABELS[targetStatus]}`;
}

function OperationTransitionButton({
  operationId,
  currentStatus,
  targetStatus,
}: {
  operationId: string;
  currentStatus: OperationStatus;
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
          {pending ? "Atualizando…" : transitionActionLabel(currentStatus, targetStatus)}
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
          currentStatus={currentStatus}
          targetStatus={targetStatus}
        />
      ))}
    </div>
  );
}
