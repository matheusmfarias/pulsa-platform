"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JobRole } from "@/modules/job-roles";
import type { Position } from "../domain/position";
import {
  createPositionAction,
  type PositionActionState,
  updatePositionAction,
} from "../actions";
const initialState: PositionActionState = { error: null };
function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.[0] ? (
    <p className="text-sm text-destructive">{errors[0]}</p>
  ) : null;
}
export function PositionForm({
  unitId,
  jobRoles,
  position,
}: {
  unitId: string;
  jobRoles: JobRole[];
  position?: Position;
}) {
  const handler = position
    ? updatePositionAction.bind(null, position.id)
    : createPositionAction;
  const [state, action, pending] = useActionState(handler, initialState);
  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="unit_id" value={unitId} />
      <div className="space-y-2">
        <Label htmlFor="job_role_id">Cargo</Label>
        <select
          id="job_role_id"
          name="job_role_id"
          defaultValue={position?.job_role_id ?? ""}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="" disabled>Selecione um cargo</option>
          {jobRoles.map((jobRole) => (
            <option key={jobRole.id} value={jobRole.id}>
              {jobRole.name}{jobRole.status === "inactive" ? " (inativo)" : ""}
            </option>
          ))}
        </select>
        <ErrorText errors={state.fieldErrors?.job_role_id} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={position?.description ?? ""}
          maxLength={2000}
          rows={5}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <ErrorText errors={state.fieldErrors?.description} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="base_required_headcount">Efetivo base necessário</Label>
        <Input
          id="base_required_headcount"
          name="base_required_headcount"
          type="number"
          min={0}
          step={1}
          defaultValue={position?.base_required_headcount ?? 0}
          required
        />
        <ErrorText errors={state.fieldErrors?.base_required_headcount} />
      </div>
      {state.error ? (
        <p
          className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando…"
            : position
              ? "Salvar alterações"
              : "Cadastrar posição"}
        </Button>
      </div>
    </form>
  );
}
