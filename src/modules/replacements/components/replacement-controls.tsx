"use client";

import { UserRoundPlus, X } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { cancelReplacementAction, createReplacementAction, type ReplacementActionState } from "../actions";
import type { ReplacementCandidate } from "../domain/replacement";

const initialState: ReplacementActionState = { error: null };

export function ReplacementDefinitionControl({
  absenceId, scheduleId, candidates,
}: { absenceId: string; scheduleId: string; candidates: ReplacementCandidate[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createReplacementAction.bind(null, absenceId, scheduleId), initialState,
  );
  if (state.success) return null;
  return <>
    <Button onClick={() => setOpen(true)} type="button" variant="outline"><UserRoundPlus aria-hidden="true" className="size-4" />Definir substituto</Button>
    {open ? <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 p-4" role="dialog">
      <div className="w-full max-w-md rounded-surface border border-border-default bg-surface p-5 shadow-lg">
        <header className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">Definir substituto</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">A nova entrada manterá o mesmo horário e posto.</p></div><Button aria-label="Fechar" onClick={() => setOpen(false)} size="icon" type="button" variant="ghost"><X aria-hidden="true" className="size-4" /></Button></header>
        <form action={formAction} className="mt-5 space-y-4"><label className="grid gap-1.5 text-sm font-medium">Colaborador<select className="h-10 rounded-control border border-border-default bg-surface px-3 text-sm" defaultValue="" name="assignment_id" required><option disabled value="">Selecione um colaborador</option>{candidates.map((candidate) => <option key={candidate.assignment_id} value={candidate.assignment_id}>{candidate.worker_full_name}</option>)}</select></label>{candidates.length === 0 ? <FeedbackMessage variant="warning">Não há colaboradores elegíveis para este horário e posto.</FeedbackMessage> : null}{state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}<div className="flex justify-end gap-2"><Button onClick={() => setOpen(false)} type="button" variant="ghost">Voltar</Button><Button disabled={pending || candidates.length === 0} type="submit">{pending ? "Definindo…" : "Confirmar"}</Button></div></form>
      </div>
    </div> : null}
  </>;
}

export function ReplacementCancelControl({
  replacementId, absenceId, scheduleId,
}: { replacementId: string; absenceId: string; scheduleId: string }) {
  const [state, formAction, pending] = useActionState(
    cancelReplacementAction.bind(null, replacementId, absenceId, scheduleId), initialState,
  );
  return <form action={formAction} className="space-y-2"><Button disabled={pending} type="submit" variant="outline">{pending ? "Cancelando…" : "Cancelar substituição"}</Button>{state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}</form>;
}
