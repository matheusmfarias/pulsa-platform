"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OperationWithContext } from "@/modules/operations";
import {
  createUnitAction,
  type UnitActionState,
  updateUnitAction,
} from "../actions";
import type { Unit } from "../domain/unit";

const initialState: UnitActionState = { error: null };
function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.[0] ? (
    <p className="text-sm text-destructive">{errors[0]}</p>
  ) : null;
}

export function UnitForm({
  operations,
  unit,
  defaultOperationId,
}: {
  operations: OperationWithContext[];
  unit?: Unit;
  defaultOperationId?: string;
}) {
  const handler = unit
    ? updateUnitAction.bind(null, unit.id)
    : createUnitAction;
  const [state, action, pending] = useActionState(handler, initialState);
  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="operation_id">Operação</Label>
        <select
          id="operation_id"
          name="operation_id"
          defaultValue={unit?.operation_id ?? defaultOperationId ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Selecione uma operação
          </option>
          {operations.map((operation) => (
            <option
              key={operation.id}
              value={operation.id}
              disabled={
                operation.status === "closed" &&
                operation.id !== unit?.operation_id
              }
            >
              {operation.contract.client.trade_name} — {operation.name}
              {operation.status === "closed" ? " (encerrada)" : ""}
            </option>
          ))}
        </select>
        <ErrorText errors={state.fieldErrors?.operation_id} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            defaultValue={unit?.name}
            required
            maxLength={160}
          />
          <ErrorText errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            name="code"
            defaultValue={unit?.code ?? ""}
            maxLength={40}
          />
          <ErrorText errors={state.fieldErrors?.code} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          name="address"
          defaultValue={unit?.address ?? ""}
          maxLength={300}
        />
        <ErrorText errors={state.fieldErrors?.address} />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            defaultValue={unit?.city ?? ""}
            maxLength={120}
          />
          <ErrorText errors={state.fieldErrors?.city} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            name="state"
            defaultValue={unit?.state ?? ""}
            maxLength={80}
          />
          <ErrorText errors={state.fieldErrors?.state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={unit?.timezone ?? "America/Sao_Paulo"}
            required
            maxLength={100}
          />
          <ErrorText errors={state.fieldErrors?.timezone} />
        </div>
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
            : unit
              ? "Salvar alterações"
              : "Cadastrar unidade"}
        </Button>
      </div>
    </form>
  );
}
