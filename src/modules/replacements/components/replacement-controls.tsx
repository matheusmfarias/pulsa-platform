"use client";

import { UserRoundPlus } from "lucide-react";
import { useActionState, useRef, useState } from "react";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { usePreservedActionState } from "@/shared/forms/use-preserved-action-state";
import { cancelReplacementAction, createReplacementAction, type ReplacementActionState } from "../actions";
import type { ReplacementCandidate } from "../domain/replacement";

const initialState: ReplacementActionState = { error: null };

export function ReplacementDefinitionControl({
  absenceId, scheduleId, candidates,
}: { absenceId: string; scheduleId: string; candidates: ReplacementCandidate[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending, preservationRef, preservationSubmit, preservationReset] = usePreservedActionState(
    createReplacementAction.bind(null, absenceId, scheduleId), initialState,
  );
  if (state.success) return null;
  return <>
    <Button onClick={() => setOpen(true)} type="button" variant="outline"><UserRoundPlus aria-hidden="true" className="size-4" />Definir substituto</Button>
    {open ? <Dialog description="A nova jornada manterá o mesmo horário e posto." onOpenChange={setOpen} open={open} title="Definir substituto">
      <form action={formAction} className="space-y-4" onReset={preservationReset} onSubmit={preservationSubmit} ref={preservationRef}><label className="grid gap-1.5 text-sm font-medium">Colaborador<select className="h-10 rounded-control border border-border-default bg-surface px-3 text-sm" defaultValue="" name="assignment_id" required><option disabled value="">Selecione um colaborador</option>{candidates.map((candidate) => <option key={candidate.assignment_id} value={candidate.assignment_id}>{candidate.worker_full_name}</option>)}</select></label>{candidates.length === 0 ? <FeedbackMessage variant="warning">Não há colaboradores elegíveis para este horário e posto.</FeedbackMessage> : null}{state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}<div className="flex justify-end gap-2"><Button onClick={() => setOpen(false)} type="button" variant="ghost">Voltar</Button><Button disabled={pending || candidates.length === 0} type="submit">{pending ? "Definindo…" : "Confirmar substituto"}</Button></div></form>
    </Dialog> : null}
  </>;
}

export function ReplacementCancelControl({
  replacementId, absenceId, scheduleId,
}: { replacementId: string; absenceId: string; scheduleId: string }) {
  const [state, formAction, pending] = useActionState(
    cancelReplacementAction.bind(null, replacementId, absenceId, scheduleId), initialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  return <div className="space-y-2">
    <form action={formAction} ref={formRef} />
    <Button disabled={pending} onClick={() => setConfirmOpen(true)} type="button" variant="outline">{pending ? "Cancelando…" : "Cancelar substituição"}</Button>
    <AlertDialog cancelLabel="Manter substituição" confirmLabel="Cancelar substituição" description="A ausência ficará sem esta cobertura. O cancelamento ficará registrado no histórico." onConfirm={() => { setConfirmOpen(false); formRef.current?.requestSubmit(); }} onOpenChange={setConfirmOpen} open={confirmOpen} title="Cancelar esta substituição?" />
    {state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}
  </div>;
}
