"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import type { Permission } from "@/modules/authorization";

import { transitionScheduleRevisionAction, type ScheduleActionState } from "../actions";
import type { ScheduleRevisionStatus } from "../domain/scheduling";

const initialState: ScheduleActionState = { error: null };
const actionsByStatus: Record<ScheduleRevisionStatus, Array<{ action: "submit" | "approve" | "return" | "publish" | "copy"; label: string; permission: Permission }>> = {
  draft: [{ action: "submit", label: "Enviar para aprovação", permission: "schedule:submit" }],
  pending_approval: [{ action: "approve", label: "Aprovar", permission: "schedule:approve" }, { action: "return", label: "Devolver para rascunho", permission: "schedule:update" }],
  approved: [{ action: "publish", label: "Publicar", permission: "schedule:publish" }, { action: "return", label: "Devolver para rascunho", permission: "schedule:update" }],
  published: [{ action: "copy", label: "Criar nova revisão", permission: "schedule:create" }],
};

export function scheduleRevisionActionsFor(status: ScheduleRevisionStatus, permissions: ReadonlySet<Permission>) {
  return actionsByStatus[status].filter((item) => permissions.has(item.permission));
}

export function ScheduleRevisionActions({ scheduleId, revisionId, status, permissions }: { scheduleId: string; revisionId: string; status: ScheduleRevisionStatus; permissions: ReadonlySet<Permission> }) {
  const actions = scheduleRevisionActionsFor(status, permissions);
  if (!actions.length) return null;
  return <div className="flex flex-wrap gap-2">{actions.map((item) => <RevisionActionButton key={item.action} scheduleId={scheduleId} revisionId={revisionId} action={item.action} label={item.label} />)}</div>;
}

function RevisionActionButton({ scheduleId, revisionId, action, label }: { scheduleId: string; revisionId: string; action: "submit" | "approve" | "return" | "publish" | "copy"; label: string }) {
  const [state, formAction, pending] = useActionState(transitionScheduleRevisionAction.bind(null, scheduleId, revisionId, action), initialState);
  const [confirming, setConfirming] = useState(false);
  if (action === "publish") {
    return <>
      <Button onClick={() => setConfirming(true)} size="sm" type="button" variant="outline">{label}</Button>
      {confirming ? <Dialog
        description="Esta revisão passará a ser a versão oficial da escala. Confira as jornadas e eventuais ausências e coberturas antes de confirmar."
        onOpenChange={setConfirming}
        open={confirming}
        title="Publicar escala"
      >
        <form action={formAction} className="space-y-4">
          {state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={pending} onClick={() => setConfirming(false)} type="button" variant="ghost">Voltar</Button>
            <Button disabled={pending} type="submit">{pending ? "Publicando…" : "Confirmar publicação"}</Button>
          </div>
        </form>
      </Dialog> : null}
    </>;
  }
  return <div>
    <form action={formAction}><Button disabled={pending} size="sm" type="submit" variant="outline">{pending ? "Atualizando…" : label}</Button></form>
    {state.error ? <FeedbackMessage className="mt-2" variant="danger">{state.error}</FeedbackMessage> : null}
  </div>;
}
