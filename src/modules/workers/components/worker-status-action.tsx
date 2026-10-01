"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false);
  const label = transitionActionLabel(currentStatus, targetStatus);
  const needsConfirmation = targetStatus === "inactive" || targetStatus === "terminated";

  return (
    <div>
      {needsConfirmation ? (
        <Button onClick={() => setOpen(true)} type="button" variant={targetStatus === "terminated" ? "destructive" : "outline"}>
          {label}
        </Button>
      ) : (
        <form action={formAction}>
          <Button disabled={pending} type="submit" variant="outline">{pending ? "Atualizando…" : label}</Button>
        </form>
      )}
      {open ? (
        <Dialog
          description={targetStatus === "terminated"
            ? "O vínculo do colaborador será encerrado. O histórico de alocações e jornadas permanecerá disponível."
            : "O colaborador ficará inativo. O histórico de alocações e jornadas permanecerá disponível."}
          onOpenChange={setOpen}
          open={open}
          title={label}
        >
          <form action={formAction} className="space-y-4">
            {state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button disabled={pending} onClick={() => setOpen(false)} type="button" variant="ghost">Voltar</Button>
              <Button disabled={pending} type="submit" variant={targetStatus === "terminated" ? "destructive" : "default"}>
                {pending ? "Atualizando…" : `Confirmar: ${label.toLowerCase()}`}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
      {!open && state.error ? <FeedbackMessage className="mt-2 max-w-sm" variant="danger">{state.error}</FeedbackMessage> : null}
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
