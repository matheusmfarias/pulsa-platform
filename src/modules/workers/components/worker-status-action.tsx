"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  changeWorkerStatusAction,
  type WorkerActionState,
} from "../actions";
import {
  WORKER_STATUS_LABELS,
  WORKER_STATUS_TRANSITIONS,
  type WorkerStatus,
} from "../domain/worker";

const initialState: WorkerActionState = { error: null };

function WorkerTransitionButton({
  workerId,
  targetStatus,
}: {
  workerId: string;
  targetStatus: WorkerStatus;
}) {
  const action = changeWorkerStatusAction.bind(
    null,
    workerId,
    targetStatus,
  );
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Atualizando…" : WORKER_STATUS_LABELS[targetStatus]}
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

export function WorkerStatusAction({
  workerId,
  currentStatus,
}: {
  workerId: string;
  currentStatus: WorkerStatus;
}) {
  const transitions = WORKER_STATUS_TRANSITIONS[currentStatus];
  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este é um estado final e não possui novas transições.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((status) => (
        <WorkerTransitionButton
          key={status}
          workerId={workerId}
          targetStatus={status}
        />
      ))}
    </div>
  );
}
