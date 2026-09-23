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

function formatCivilDate(value: string) {
  return value.split("-").reverse().join("/");
}

export function ScheduleForm({ organizationId, operations, copySources, schedulePeriods }: { organizationId: string; operations: OperationWithContext[]; copySources: PublishedScheduleCopySource[]; schedulePeriods: Array<{ id: string; operation_id: string; period_start: string; period_end: string }> }) {
  const [state, formAction, pending] = useActionState(createScheduleAction, initialState);
  const [mode, setMode] = useState<"blank" | "copy">("blank");
  const [operationId, setOperationId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [sourceScheduleId, setSourceScheduleId] = useState("");
  const [edited, setEdited] = useState<{ actionState: ScheduleActionState; fields: string[] }>({ actionState: state, fields: [] });
  const editedFields = edited.actionState === state ? edited.fields : [];
  const markEdited = (field: string) => setEdited((current) => ({ actionState: state, fields: [...new Set([...(current.actionState === state ? current.fields : []), field])] }));
  const fieldError = (field: "operation_id" | "period_start" | "period_end" | "source_schedule_id") => editedFields.includes(field) ? undefined : state.fieldErrors?.[field];
  const sources = useMemo(() => copySources.filter((source) => source.operation_id === operationId && (!periodStart || source.period_end < periodStart)), [copySources, operationId, periodStart]);
  const conflict = useMemo(() => schedulePeriods.find((schedule) => schedule.operation_id === operationId && periodStart && periodEnd && schedule.period_start <= periodEnd && schedule.period_end >= periodStart), [operationId, periodEnd, periodStart, schedulePeriods]);
  const invalidPeriod = Boolean(periodStart && periodEnd && periodEnd < periodStart);
  const noCopySource = mode === "copy" && Boolean(operationId && periodStart && !sources.length);
  const changePeriodStart = (value: string) => { setPeriodStart(value); setSourceScheduleId(""); markEdited("period_start"); markEdited("period_end"); markEdited("source_schedule_id"); };
  const changePeriodEnd = (value: string) => { setPeriodEnd(value); markEdited("period_end"); };

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <input name="organization_id" type="hidden" value={organizationId} />
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">1. Ponto de partida</legend>
        <p className="text-sm leading-6 text-muted-foreground">Crie um rascunho vazio ou use as jornadas de uma escala publicada anterior como base editável.</p>
        <div className="flex flex-wrap gap-2">
          <Button aria-pressed={mode === "blank"} onClick={() => setMode("blank")} type="button" variant={mode === "blank" ? "default" : "outline"}>Começar sem jornadas</Button>
          <Button aria-pressed={mode === "copy"} onClick={() => setMode("copy")} type="button" variant={mode === "copy" ? "default" : "outline"}>Copiar escala anterior</Button>
        </div>
      </fieldset>

      <section aria-labelledby="schedule-period-heading" className="space-y-5 border-t border-border-default pt-8">
        <div>
          <h2 className="text-sm font-semibold" id="schedule-period-heading">2. Operação e período</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Escolha os dias que esta escala vai organizar. O período não pode se sobrepor a outra escala da mesma operação.</p>
        </div>
        <Field error={fieldError("operation_id")} id="operation_id" label="Operação" required>
          <Select defaultValue="" name="operation_id" onChange={(event) => { setOperationId(event.target.value); setSourceScheduleId(""); markEdited("operation_id"); markEdited("source_schedule_id"); }}>
            <option disabled value="">Selecione uma operação</option>
            {operations.map((operation) => <option key={operation.id} value={operation.id}>{operation.contract.client.trade_name} — {operation.name}</option>)}
          </Select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field error={fieldError("period_start")} id="period_start" label="Início do período" required>
            <Input name="period_start" onChange={(event) => changePeriodStart(event.target.value)} onInput={(event) => changePeriodStart(event.currentTarget.value)} type="date" />
          </Field>
          <Field error={invalidPeriod ? "O fim do período não pode anteceder o início." : fieldError("period_end")} id="period_end" label="Fim do período" required>
            <Input name="period_end" onChange={(event) => changePeriodEnd(event.target.value)} onInput={(event) => changePeriodEnd(event.currentTarget.value)} type="date" />
          </Field>
        </div>
        {conflict ? <FeedbackMessage variant="warning">Já existe uma escala para esta operação de {formatCivilDate(conflict.period_start)} a {formatCivilDate(conflict.period_end)}. Escolha outro período para continuar.</FeedbackMessage> : null}
      </section>

      {mode === "copy" ? (
        <section aria-labelledby="schedule-source-heading" className="space-y-4 border-t border-border-default pt-8">
          <div>
            <h2 className="text-sm font-semibold" id="schedule-source-heading">3. Escala de origem</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">As jornadas elegíveis serão copiadas para o novo período. Confira e ajuste o rascunho antes de enviar para aprovação.</p>
          </div>
          {noCopySource ? <FeedbackMessage>Nenhuma escala publicada anterior está disponível para esta operação e este início de período. Escolha outro período ou comece sem jornadas.</FeedbackMessage> : (
            <Field error={fieldError("source_schedule_id")} id="source_schedule_id" label="Escala publicada anterior" required>
              <Select disabled={!operationId || !periodStart} name="source_schedule_id" onChange={(event) => { setSourceScheduleId(event.target.value); markEdited("source_schedule_id"); }} value={sourceScheduleId}>
                <option value="">{operationId && periodStart ? "Selecione uma escala publicada" : "Selecione a operação e o novo período"}</option>
                {sources.map((source) => <option key={source.id} value={source.id}>{formatCivilDate(source.period_start)} — {formatCivilDate(source.period_end)} · v{source.publishedVersion}</option>)}
              </Select>
            </Field>
          )}
        </section>
      ) : null}

      <input name="creation_mode" type="hidden" value={mode} />
      {state.error && !editedFields.length ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}
      <div className="flex flex-col-reverse gap-4 border-t border-border-default pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm leading-6 text-muted-foreground">Ao criar, você vai para o detalhe da escala. Ela só ficará disponível para a operação depois da aprovação e publicação.</p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button asChild variant="ghost"><Link href="/app/scheduling">Cancelar</Link></Button>
          <Button disabled={pending || invalidPeriod || Boolean(conflict) || noCopySource || (mode === "copy" && !sourceScheduleId)} type="submit">{pending ? "Criando…" : "Criar rascunho"}</Button>
        </div>
      </div>
    </form>
  );
}
