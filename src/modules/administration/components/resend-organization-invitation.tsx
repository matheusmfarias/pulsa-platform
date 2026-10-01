"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";

import { resendOrganizationInvitationAction, type AdministrationActionState } from "../actions";

export function ResendOrganizationInvitation({ profileId }: { profileId: string }) {
  const action = resendOrganizationInvitationAction.bind(null, profileId);
  const [state, formAction, pending] = useActionState<AdministrationActionState>(action, { error: null });
  return (
    <form action={formAction} className="space-y-3">
      <Button disabled={pending} type="submit" variant="outline">
        {pending ? "Enviando…" : "Reenviar código de ativação"}
      </Button>
      {state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}
      {state.success ? <FeedbackMessage variant="success">{state.success}</FeedbackMessage> : null}
    </form>
  );
}
