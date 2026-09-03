"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { PositionWithContext } from "@/modules/positions";
import type { Worker } from "@/modules/workers";

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

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <section aria-labelledby="assignment-relation-heading">
        <div>
          <h2 className="font-semibold" id="assignment-relation-heading">
            Vínculo operacional
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Defina qual colaborador será vinculado a qual posto.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field
            error={state.fieldErrors?.worker_id}
            id="worker_id"
            label="Colaborador"
            required
          >
            <Select
              defaultValue={
                assignment?.worker_id ?? defaultWorkerId ?? ""
              }
              name="worker_id"
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
                    ? ` (${worker.status})`
                    : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            error={state.fieldErrors?.position_id}
            id="position_id"
            label="Posto"
            required
          >
            <Select
              defaultValue={
                assignment?.position_id ?? defaultPositionId ?? ""
              }
              name="position_id"
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
            Informe quando o vínculo começa e, quando aplicável, sua data de término.
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            error={state.fieldErrors?.start_date}
            id="start_date"
            label="Data inicial"
            required
          >
            <Input
              defaultValue={assignment?.start_date ?? ""}
              name="start_date"
              type="date"
            />
          </Field>

          <Field
            error={state.fieldErrors?.end_date}
            id="end_date"
            label="Data final"
            optional
          >
            <Input
              defaultValue={assignment?.end_date ?? ""}
              name="end_date"
              type="date"
            />
          </Field>
        </div>
      </section>

      {state.error ? (
        <FeedbackMessage variant="danger">
          {state.error}
        </FeedbackMessage>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border-default pt-6 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>

        <Button disabled={pending} type="submit">
          {pending
            ? "Salvando…"
            : assignment
              ? "Salvar alterações"
              : "Criar alocação"}
        </Button>
      </div>
    </form>
  );
}