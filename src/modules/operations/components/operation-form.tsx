"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContractWithClient } from "@/modules/contracts";

import {
  createOperationAction,
  type OperationActionState,
  updateOperationAction,
} from "../actions";
import type { Operation } from "../domain/operation";

const initialState: OperationActionState = { error: null };

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return <p id={id} className="text-sm text-destructive">{errors[0]}</p>;
}

export function OperationForm({
  contracts,
  operation,
  defaultContractId,
}: {
  contracts: ContractWithClient[];
  operation?: Operation;
  defaultContractId?: string;
}) {
  const action = operation
    ? updateOperationAction.bind(null, operation.id)
    : createOperationAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="contract_id">Contrato</Label>
        <select
          id="contract_id"
          name="contract_id"
          defaultValue={operation?.contract_id ?? defaultContractId ?? ""}
          required
          aria-invalid={Boolean(state.fieldErrors?.contract_id)}
          aria-describedby={state.fieldErrors?.contract_id ? "contract-error" : undefined}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>Selecione um contrato</option>
          {contracts.map((contract) => (
            <option
              key={contract.id}
              value={contract.id}
              disabled={contract.status !== "active" && contract.id !== operation?.contract_id}
            >
              {contract.client.trade_name} — {contract.name}
              {contract.status !== "active" ? " (não ativo)" : ""}
            </option>
          ))}
        </select>
        <FieldError errors={state.fieldErrors?.contract_id} id="contract-error" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          defaultValue={operation?.name}
          maxLength={160}
          required
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
        />
        <FieldError errors={state.fieldErrors?.name} id="name-error" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={operation?.description ?? ""}
          maxLength={2000}
          rows={5}
          aria-invalid={Boolean(state.fieldErrors?.description)}
          aria-describedby={state.fieldErrors?.description ? "description-error" : undefined}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <FieldError errors={state.fieldErrors?.description} id="description-error" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_date">Data inicial</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={operation?.start_date}
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
            defaultValue={operation?.end_date ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.end_date)}
            aria-describedby={state.fieldErrors?.end_date ? "end-date-error" : undefined}
          />
          <FieldError errors={state.fieldErrors?.end_date} id="end-date-error" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager_user_id">ID do gestor responsável</Label>
        <Input
          id="manager_user_id"
          name="manager_user_id"
          defaultValue={operation?.manager_user_id ?? ""}
          placeholder="Opcional — UUID de um membro ativo"
          aria-invalid={Boolean(state.fieldErrors?.manager_user_id)}
          aria-describedby={
            state.fieldErrors?.manager_user_id ? "manager-error" : "manager-hint"
          }
        />
        <p id="manager-hint" className="text-xs text-muted-foreground">
          O gestor deve possuir membership ativa na organização.
        </p>
        <FieldError errors={state.fieldErrors?.manager_user_id} id="manager-error" />
      </div>

      {state.error ? (
        <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : operation ? "Salvar alterações" : "Cadastrar operação"}
        </Button>
      </div>
    </form>
  );
}
