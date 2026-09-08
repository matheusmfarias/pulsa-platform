"use client";

import { useActionState } from "react";

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
  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm("Cancelar esta ausência? O registro permanecerá no histórico.")) {
            event.preventDefault();
          }
        }}
      >
        <Button disabled={pending} type="submit" variant="outline">
          {pending ? "Cancelando…" : "Cancelar ausência"}
        </Button>
      </form>
      {state.error ? (
        <FeedbackMessage className="mt-3" variant="danger">
          {state.error}
        </FeedbackMessage>
      ) : null}
    </div>
  );
}
