"use client";

import { useActionState, useRef, useState } from "react";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";

import { cancelAbsenceAction, type AbsenceActionState } from "../actions";

const initialState: AbsenceActionState = { error: null };

export function AbsenceCancelAction({
  absenceId,
  scheduleId,
}: {
  absenceId: string;
  scheduleId: string;
}) {
  const [state, formAction, pending] = useActionState(
    cancelAbsenceAction.bind(null, absenceId, scheduleId),
    initialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <div>
      <form action={formAction} ref={formRef} />
      <Button disabled={pending} onClick={() => setConfirmOpen(true)} type="button" variant="outline">
        {pending ? "Cancelando…" : "Cancelar ausência"}
      </Button>
      <AlertDialog
        cancelLabel="Manter ausência"
        confirmLabel="Cancelar ausência"
        description="O registro permanecerá no histórico após o cancelamento."
        onConfirm={() => { setConfirmOpen(false); formRef.current?.requestSubmit(); }}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Cancelar esta ausência?"
      />
      {state.error ? (
        <FeedbackMessage className="mt-3" variant="danger">
          {state.error}
        </FeedbackMessage>
      ) : null}
    </div>
  );
}
