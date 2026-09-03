"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ContractWithClient } from "@/modules/contracts";

import {
  createOperationAction,
  type OperationActionState,
  updateOperationAction,
} from "../actions";
import type { Operation } from "../domain/operation";

const initialState: OperationActionState = { error: null };

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
      <Field
        id="contract_id"
        label="Contrato"
        error={state.fieldErrors?.contract_id}
        required
      >
        <Select
          name="contract_id"
          defaultValue={operation?.contract_id ?? defaultContractId ?? ""}
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
        </Select>
      </Field>

      <Field id="name" label="Nome" error={state.fieldErrors?.name} required>
        <Input name="name" defaultValue={operation?.name} maxLength={160} />
      </Field>

      <Field
        id="description"
        label="Descrição"
        error={state.fieldErrors?.description}
        optional
      >
        <Textarea
          name="description"
          defaultValue={operation?.description ?? ""}
          maxLength={2000}
          rows={5}
        />
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
            defaultValue={operation?.start_date}
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
            defaultValue={operation?.end_date ?? ""}
          />
        </Field>
      </div>

      <Field
        id="manager_user_id"
        label="ID do gestor responsável"
        description="O gestor deve possuir membership ativa na organização."
        error={state.fieldErrors?.manager_user_id}
        optional
      >
        <Input
          name="manager_user_id"
          defaultValue={operation?.manager_user_id ?? ""}
          placeholder="UUID de um membro ativo"
        />
      </Field>

      {state.error ? (
        <FeedbackMessage variant="danger">{state.error}</FeedbackMessage>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : operation ? "Salvar alterações" : "Cadastrar operação"}
        </Button>
      </div>
    </form>
  );
}
