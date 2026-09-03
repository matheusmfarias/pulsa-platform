"use client";

import Link from "next/link";
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
  cancelHref,
}: {
  contracts: ContractWithClient[];
  operation?: Operation;
  defaultContractId?: string;
  cancelHref: string;
}) {
  const action = operation
    ? updateOperationAction.bind(null, operation.id)
    : createOperationAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <section aria-labelledby="operation-context-heading">
        <div>
          <h2 className="font-semibold" id="operation-context-heading">
            Contexto contratual
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Defina o contrato ao qual esta operação pertence e sua identificação.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field
            error={state.fieldErrors?.contract_id}
            id="contract_id"
            label="Contrato"
            required
          >
            <Select
              defaultValue={
                operation?.contract_id ?? defaultContractId ?? ""
              }
              name="contract_id"
            >
              <option disabled value="">
                Selecione um contrato
              </option>

              {contracts.map((contract) => (
                <option
                  disabled={
                    contract.status !== "active" &&
                    contract.id !== operation?.contract_id
                  }
                  key={contract.id}
                  value={contract.id}
                >
                  {contract.client.trade_name} — {contract.name}
                  {contract.status !== "active" ? " (não ativo)" : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            error={state.fieldErrors?.name}
            id="name"
            label="Nome"
            required
          >
            <Input
              defaultValue={operation?.name ?? ""}
              maxLength={160}
              name="name"
            />
          </Field>
        </div>
      </section>

      <section
        aria-labelledby="operation-period-heading"
        className="border-t border-border-default pt-8"
      >
        <div>
          <h2 className="font-semibold" id="operation-period-heading">
            Período
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Informe quando a operação inicia e, quando aplicável, sua data prevista ou efetiva de término.
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
              defaultValue={operation?.start_date ?? ""}
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
              defaultValue={operation?.end_date ?? ""}
              name="end_date"
              type="date"
            />
          </Field>
        </div>
      </section>

      <section
        aria-labelledby="operation-details-heading"
        className="border-t border-border-default pt-8"
      >
        <div>
          <h2 className="font-semibold" id="operation-details-heading">
            Informações adicionais
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Registre informações complementares necessárias para compreender esta operação.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field
            error={state.fieldErrors?.description}
            id="description"
            label="Descrição"
            optional
          >
            <Textarea
              defaultValue={operation?.description ?? ""}
              maxLength={2000}
              name="description"
              rows={5}
            />
          </Field>

          <Field
            description="Informe o identificador de um membro ativo da organização."
            error={state.fieldErrors?.manager_user_id}
            id="manager_user_id"
            label="Identificador do gestor responsável"
            optional
          >
            <Input
              defaultValue={operation?.manager_user_id ?? ""}
              name="manager_user_id"
              placeholder="UUID de um membro ativo"
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
            : operation
              ? "Salvar alterações"
              : "Cadastrar operação"}
        </Button>
      </div>
    </form>
  );
}