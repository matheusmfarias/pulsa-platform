"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";

import { changeWorkerStatusAction, type WorkerActionState } from "../actions";
import { WORKER_STATUS_TRANSITIONS, type WorkerStatus } from "../domain/worker";

const initialState: WorkerActionState = { error: null };

function transitionActionLabel(
  currentStatus: WorkerStatus,
  targetStatus: WorkerStatus,
): string {
  if (targetStatus === "active") {
    return currentStatus === "inactive"
      ? "Reativar colaborador"
      : "Ativar colaborador";
  }
  if (targetStatus === "inactive") return "Marcar como inativo";
  if (targetStatus === "terminated") return "Encerrar vínculo";
  return "Atualizar status";
}

function WorkerTransitionButton({
  workerId,
  currentStatus,
  targetStatus,
}: {
  workerId: string;
  currentStatus: WorkerStatus;
  targetStatus: WorkerStatus;
}) {
  const action = changeWorkerStatusAction.bind(null, workerId, targetStatus);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <Button
          disabled={pending}
          type="submit"
          variant={targetStatus === "terminated" ? "destructive" : "outline"}
        >
          {pending
            ? "Atualizando…"
            : transitionActionLabel(currentStatus, targetStatus)}
        </Button>
      </form>
      {state.error ? (
        <FeedbackMessage className="mt-2 max-w-sm" variant="danger">
          {state.error}
        </FeedbackMessage>
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
      {transitions.map((targetStatus) => (
        <WorkerTransitionButton
          currentStatus={currentStatus}
          key={targetStatus}
          targetStatus={targetStatus}
          workerId={workerId}
        />
      ))}
    </div>
  );
}
