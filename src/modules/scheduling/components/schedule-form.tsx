"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { OperationWithContext } from "@/modules/operations";

import { createScheduleAction, type ScheduleActionState } from "../actions";
import type { PublishedScheduleCopySource } from "../services/scheduling-services";

const initialState: ScheduleActionState = { error: null };

export function ScheduleForm({ organizationId, operations, copySources, schedulePeriods }: { organizationId: string; operations: OperationWithContext[]; copySources: PublishedScheduleCopySource[]; schedulePeriods: Array<{ id: string; operation_id: string; period_start: string; period_end: string }> }) {
  const [state, formAction, pending] = useActionState(createScheduleAction, initialState);
  const [mode, setMode] = useState<"blank" | "copy">("blank");
  const [operationId, setOperationId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const sources = useMemo(() => copySources.filter((source) => source.operation_id === operationId && (!periodStart || source.period_end < periodStart)), [copySources, operationId, periodStart]);
  const conflict = useMemo(() => schedulePeriods.find((schedule) => schedule.operation_id === operationId && periodStart && periodEnd && schedule.period_start <= periodEnd && schedule.period_end >= periodStart), [operationId, periodEnd, periodStart, schedulePeriods]);
  return (
    <form action={formAction} className="space-y-8" noValidate>
      <input name="organization_id" type="hidden" value={organizationId} />
      <fieldset className="space-y-3"><legend className="text-sm font-medium">Como deseja criar?</legend><div className="flex flex-wrap gap-2"><Button onClick={() => setMode("blank")} type="button" variant={mode === "blank" ? "default" : "outline"}>Criar do zero</Button><Button onClick={() => setMode("copy")} type="button" variant={mode === "copy" ? "default" : "outline"}>Copiar escala anterior</Button></div></fieldset>
      <Field error={state.fieldErrors?.operation_id} id="operation_id" label="Operação" required>
        <Select defaultValue="" name="operation_id" onChange={(event) => setOperationId(event.target.value)}>
          <option disabled value="">Selecione uma operação</option>
          {operations.map((operation) => <option key={operation.id} value={operation.id}>{operation.contract.client.trade_name} — {operation.name}</option>)}
        </Select>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field error={state.fieldErrors?.period_start} id="period_start" label="Início do período" required>
          <Input name="period_start" onChange={(event) => setPeriodStart(event.target.value)} type="date" />
        </Field>
        <Field error={state.fieldErrors?.period_end} id="period_end" label="Fim do período" required>
          <Input name="period_end" onChange={(event) => setPeriodEnd(event.target.value)} type="date" />
        </Field>
      </div>
      {mode === "copy" ? (operationId && periodStart && !sources.length ? <div className="rounded-control border border-border-default bg-muted/40 px-3 py-2 text-sm"><p>Nenhuma escala publicada anterior disponível para esta operação.</p><p className="mt-1 text-muted-foreground">Uma escala precisa estar publicada para ser usada como base.</p></div> : <Field id="source_schedule_id" label="Escala publicada anterior" required><Select disabled={!operationId || !periodStart} name="source_schedule_id" required><option value="">{operationId && periodStart ? "Selecione uma escala publicada" : "Selecione a operação e o novo período"}</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.period_start.split("-").reverse().join("/")} — {source.period_end.split("-").reverse().join("/")} · v{source.publishedVersion}</option>)}</Select></Field>) : null}
      {conflict ? <FeedbackMessage variant="warning">Já existe uma escala para esta operação entre {conflict.period_start.split("-").reverse().join("/")} e {conflict.period_end.split("-").reverse().join("/")}.</FeedbackMessage> : null}
      <input name="creation_mode" type="hidden" value={mode} />
      {state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}
      <div className="flex flex-col-reverse gap-3 border-t border-border-default pt-6 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost"><Link href="/app/scheduling">Cancelar</Link></Button>
        <Button disabled={pending} type="submit">{pending ? "Criando…" : "Criar escala"}</Button>
      </div>
    </form>
  );
}
