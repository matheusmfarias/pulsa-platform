"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Client } from "@/modules/clients";

import {
  createContractAction,
  type ContractActionState,
  updateContractAction,
} from "../actions";
import type { Contract } from "../domain/contract";

const initialState: ContractActionState = { error: null };

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function ContractForm({
  clients,
  contract,
  defaultClientId,
}: {
  clients: Client[];
  contract?: Contract;
  defaultClientId?: string;
}) {
  const action = contract
    ? updateContractAction.bind(null, contract.id)
    : createContractAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="client_id">Cliente</Label>
        <select
          id="client_id"
          name="client_id"
          defaultValue={contract?.client_id ?? defaultClientId ?? ""}
          required
          aria-invalid={Boolean(state.fieldErrors?.client_id)}
          aria-describedby={state.fieldErrors?.client_id ? "client-error" : undefined}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>
            Selecione um cliente
          </option>
          {clients.map((client) => (
            <option
              key={client.id}
              value={client.id}
              disabled={client.status === "inactive" && client.id !== contract?.client_id}
            >
              {client.trade_name}
              {client.status === "inactive" ? " (inativo)" : ""}
            </option>
          ))}
        </select>
        <FieldError errors={state.fieldErrors?.client_id} id="client-error" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          defaultValue={contract?.name}
          maxLength={160}
          required
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
        />
        <FieldError errors={state.fieldErrors?.name} id="name-error" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_date">Data inicial</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={contract?.start_date}
            required
            aria-invalid={Boolean(state.fieldErrors?.start_date)}
            aria-describedby={state.fieldErrors?.start_date ? "start-date-error" : undefined}
          />
          <FieldError errors={state.fieldErrors?.start_date} id="start-date-error" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Data final</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={contract?.end_date ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.end_date)}
            aria-describedby={state.fieldErrors?.end_date ? "end-date-error" : undefined}
          />
          <FieldError errors={state.fieldErrors?.end_date} id="end-date-error" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="external_reference">Referência externa</Label>
        <Input
          id="external_reference"
          name="external_reference"
          defaultValue={contract?.external_reference ?? ""}
          maxLength={160}
          aria-invalid={Boolean(state.fieldErrors?.external_reference)}
          aria-describedby={
            state.fieldErrors?.external_reference
              ? "external-reference-error"
              : undefined
          }
        />
        <FieldError
          errors={state.fieldErrors?.external_reference}
          id="external-reference-error"
        />
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
            : contract
              ? "Salvar alterações"
              : "Cadastrar contrato"}
        </Button>
      </div>
    </form>
  );
}
