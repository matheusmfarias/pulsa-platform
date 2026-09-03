"use client";

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
}: {
  assignment?: Assignment;
  workers: Worker[];
  positions: PositionWithContext[];
  defaultWorkerId?: string;
  defaultPositionId?: string;
}) {
  const action = assignment
    ? updateAssignmentAction.bind(null, assignment.id)
    : createAssignmentAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Field
        id="worker_id"
        label="Colaborador"
        error={state.fieldErrors?.worker_id}
        required
      >
        <Select
          name="worker_id"
          defaultValue={assignment?.worker_id ?? defaultWorkerId ?? ""}
        >
          <option value="" disabled>Selecione um colaborador</option>
          {workers.map((worker) => (
            <option
              key={worker.id}
              value={worker.id}
              disabled={worker.status !== "active" && worker.id !== assignment?.worker_id}
            >
              {worker.full_name}{worker.status !== "active" ? ` (${worker.status})` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        id="position_id"
        label="Posto"
        error={state.fieldErrors?.position_id}
        required
      >
        <Select
          name="position_id"
          defaultValue={assignment?.position_id ?? defaultPositionId ?? ""}
        >
          <option value="" disabled>Selecione um posto</option>
          {positions.map((position) => (
            <option
              key={position.id}
              value={position.id}
              disabled={position.status !== "active" && position.id !== assignment?.position_id}
            >
              {position.job_role.name} — {position.unit.name}
              {position.status !== "active" ? " (inativa)" : ""}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="start_date"
          label="Data inicial"
          error={state.fieldErrors?.start_date}
          required
        >
          <Input
            name="start_date"
            type="date"
            defaultValue={assignment?.start_date}
          />
        </Field>
        <Field
          id="end_date"
          label="Data final"
          error={state.fieldErrors?.end_date}
          optional
        >
          <Input
            name="end_date"
            type="date"
            defaultValue={assignment?.end_date ?? ""}
          />
        </Field>
      </div>

      {state.error ? (
        <FeedbackMessage variant="danger">{state.error}</FeedbackMessage>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : assignment ? "Salvar alterações" : "Criar alocação"}
        </Button>
      </div>
    </form>
  );
}
