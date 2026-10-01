"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackMessage } from "@/components/ui/feedback-message";

import {
  changeMembershipStatusAction,
  type AdministrationActionState,
} from "../actions";
import type { MembershipStatus } from "../domain/organization-member";

const initialState: AdministrationActionState = { error: null };

export function MembershipStatusAction({
  profileId,
  currentStatus,
}: {
  profileId: string;
  currentStatus: MembershipStatus;
}) {
  const targetStatus = currentStatus === "active" ? "inactive" : "active";
  const action = changeMembershipStatusAction.bind(null, profileId, targetStatus);
  const [open, setOpen] = useState(false);
  const isDeactivation = targetStatus === "inactive";
  const [state, formAction, pending] = useActionState(
    async (previousState: AdministrationActionState) => {
      const result = await action(previousState);
      if (result.success) setOpen(false);
      return result;
    },
    initialState,
  );

  return (
    <div>
      <Button onClick={() => setOpen(true)} type="button" variant="outline">
        {isDeactivation ? "Desativar acesso" : "Reativar acesso"}
      </Button>
      {open ? (
        <Dialog
          description={isDeactivation
            ? "Esta pessoa perderá o acesso à organização. O histórico das ações será preservado. O último Diretor ativo não pode ser desativado."
            : "Esta pessoa voltará a ter acesso à organização com o papel atual."}
          onOpenChange={setOpen}
          open={open}
          title={isDeactivation ? "Desativar acesso" : "Reativar acesso"}
        >
          <form action={formAction} className="space-y-4">
            {state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button disabled={pending} onClick={() => setOpen(false)} type="button" variant="ghost">Voltar</Button>
              <Button disabled={pending} type="submit" variant={isDeactivation ? "destructive" : "default"}>
                {pending ? "Atualizando…" : isDeactivation ? "Confirmar desativação" : "Confirmar reativação"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
      {!open && state.success ? <FeedbackMessage className="mt-2" variant="success">{state.success}</FeedbackMessage> : null}
    </div>
  );
}
