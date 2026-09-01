"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PositionWithContext } from "@/modules/positions";
import type { Worker } from "@/modules/workers";

import { createAssignmentAction, type AssignmentActionState, updateAssignmentAction } from "../actions";
import type { Assignment } from "../domain/assignment";

const initialState: AssignmentActionState = { error: null };

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="text-sm text-destructive">{errors[0]}</p> : null;
}

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
      <div className="space-y-2">
        <Label htmlFor="worker_id">Colaborador</Label>
        <select
          id="worker_id"
          name="worker_id"
          defaultValue={assignment?.worker_id ?? defaultWorkerId ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
        </select>
        <FieldError errors={state.fieldErrors?.worker_id} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="position_id">Posto</Label>
        <select
          id="position_id"
          name="position_id"
          defaultValue={assignment?.position_id ?? defaultPositionId ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
        </select>
        <FieldError errors={state.fieldErrors?.position_id} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_date">Data inicial</Label>
          <Input id="start_date" name="start_date" type="date" defaultValue={assignment?.start_date} required />
          <FieldError errors={state.fieldErrors?.start_date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Data final</Label>
          <Input id="end_date" name="end_date" type="date" defaultValue={assignment?.end_date ?? ""} />
          <FieldError errors={state.fieldErrors?.end_date} />
        </div>
      </div>
      {state.error ? <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : assignment ? "Salvar alterações" : "Criar alocação"}
        </Button>
      </div>
    </form>
  );
}
