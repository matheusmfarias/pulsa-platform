"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { PositionWithContext } from "@/modules/positions";
import { WORKER_STATUS_LABELS, type Worker } from "@/modules/workers/domain/worker";
import { usePreservedActionState } from "@/shared/forms/use-preserved-action-state";

import {
  createAssignmentAction,
  type AssignmentActionState,
  updateAssignmentAction,
} from "../actions";
import type { Assignment } from "../domain/assignment";

const initialState: AssignmentActionState = { error: null };

export function AssignmentForm({
  assignment,
  workers,
  positions,
  defaultWorkerId,
  defaultPositionId,
  cancelHref,
}: {
  assignment?: Assignment;
  workers: Worker[];
  positions: PositionWithContext[];
  defaultWorkerId?: string;
  defaultPositionId?: string;
  cancelHref: string;
}) {
  const action = assignment
    ? updateAssignmentAction.bind(null, assignment.id)
    : createAssignmentAction;

  const [state, formAction, pending, preservationRef, preservationSubmit, preservationReset] = usePreservedActionState(action, initialState);
  const [startDate, setStartDate] = useState(assignment?.start_date ?? "");
  const [endDate, setEndDate] = useState(assignment?.end_date ?? "");
  const [edited, setEdited] = useState<{ actionState: AssignmentActionState; fields: string[] }>({ actionState: state, fields: [] });
  const editedFields = edited.actionState === state ? edited.fields : [];
  const markEdited = (field: string) => setEdited((current) => ({ actionState: state, fields: [...new Set([...(current.actionState === state ? current.fields : []), field])] }));
  const fieldError = (field: "worker_id" | "position_id" | "start_date" | "end_date") => editedFields.includes(field) ? undefined : state.fieldErrors?.[field];
  const invalidPeriod = Boolean(startDate && endDate && endDate < startDate);
  const changeStartDate = (value: string) => { setStartDate(value); markEdited("start_date"); markEdited("end_date"); };
  const changeEndDate = (value: string) => { setEndDate(value); markEdited("end_date"); };

  return (
    <form action={formAction} className="space-y-8" noValidate onReset={preservationReset} onSubmit={preservationSubmit} ref={preservationRef}>
      <section aria-labelledby="assignment-relation-heading">
        <div>
          <h2 className="font-semibold" id="assignment-relation-heading">
            Vínculo operacional
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Escolha a pessoa e o posto onde ela vai atuar. Apenas colaboradores e postos ativos podem receber uma nova alocação.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field
            error={fieldError("worker_id")}
            id="worker_id"
            label="Colaborador"
            required
          >
            <Select
              defaultValue={
                assignment?.worker_id ?? defaultWorkerId ?? ""
              }
              name="worker_id"
              onChange={() => markEdited("worker_id")}
            >
              <option disabled value="">
                Selecione um colaborador
              </option>

              {workers.map((worker) => (
                <option
                  disabled={
                    worker.status !== "active" &&
                    worker.id !== assignment?.worker_id
                  }
                  key={worker.id}
                  value={worker.id}
                >
                  {worker.full_name}
                  {worker.status !== "active"
                    ? ` (${WORKER_STATUS_LABELS[worker.status]})`
                    : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            error={fieldError("position_id")}
            id="position_id"
            label="Posto"
            required
          >
            <Select
              defaultValue={
                assignment?.position_id ?? defaultPositionId ?? ""
              }
              name="position_id"
              onChange={() => markEdited("position_id")}
            >
              <option disabled value="">
                Selecione um posto
              </option>

              {positions.map((position) => (
                <option
                  disabled={
                    position.status !== "active" &&
                    position.id !== assignment?.position_id
                  }
                  key={position.id}
                  value={position.id}
                >
                  {position.job_role.name} — {position.unit.name}
                  {position.status !== "active" ? " (inativo)" : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section
        aria-labelledby="assignment-period-heading"
        className="border-t border-border-default pt-8"
      >
        <div>
          <h2 className="font-semibold" id="assignment-period-heading">
            Período da alocação
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Informe quando o vínculo começa. Deixe a data final vazia se não houver término previsto.
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            error={fieldError("start_date")}
            id="start_date"
            label="Data inicial"
            required
          >
            <Input
              defaultValue={assignment?.start_date ?? ""}
              name="start_date"
              onChange={(event) => changeStartDate(event.target.value)}
              onInput={(event) => changeStartDate(event.currentTarget.value)}
              type="date"
            />
          </Field>

          <Field
            error={invalidPeriod ? "A data final não pode anteceder a inicial." : fieldError("end_date")}
            id="end_date"
            label="Data final"
            optional
          >
            <Input
              defaultValue={assignment?.end_date ?? ""}
              name="end_date"
              onChange={(event) => changeEndDate(event.target.value)}
              onInput={(event) => changeEndDate(event.currentTarget.value)}
              type="date"
            />
          </Field>
        </div>
      </section>

      {state.error && !editedFields.length ? (
        <FeedbackMessage variant="danger">
          {state.error}
        </FeedbackMessage>
      ) : null}

      <div className="flex flex-col-reverse gap-4 border-t border-border-default pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {assignment
            ? "Depois de salvar, você volta ao detalhe da alocação para conferir as alterações."
            : "Depois de criar, você vai para o detalhe da alocação. As jornadas são organizadas separadamente em Escalas."}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button asChild variant="ghost">
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button disabled={pending || invalidPeriod} type="submit">
            {pending ? "Salvando…" : assignment ? "Salvar alterações" : "Criar alocação"}
          </Button>
        </div>
      </div>
    </form>
  );
}
