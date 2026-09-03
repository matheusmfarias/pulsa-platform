"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Client } from "@/modules/clients";

import {
  createContractAction,
  type ContractActionState,
  updateContractAction,
} from "../actions";
import type { Contract } from "../domain/contract";

const initialState: ContractActionState = { error: null };

export function ContractForm({
  clients,
  contract,
  defaultClientId,
  cancelHref,
}: {
  clients: Client[];
  contract?: Contract;
  defaultClientId?: string;
  cancelHref: string;
}) {
  const action = contract
    ? updateContractAction.bind(null, contract.id)
    : createContractAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <section aria-labelledby="contract-context-heading">
        <div>
          <h2 className="font-semibold" id="contract-context-heading">
            Vínculo comercial
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Defina o cliente ao qual este contrato pertence e sua identificação.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field
            error={state.fieldErrors?.client_id}
            id="client_id"
            label="Cliente"
            required
          >
            <Select
              defaultValue={
                contract?.client_id ?? defaultClientId ?? ""
              }
              name="client_id"
            >
              <option disabled value="">
                Selecione um cliente
              </option>

              {clients.map((client) => (
                <option
                  disabled={
                    client.status === "inactive" &&
                    client.id !== contract?.client_id
                  }
                  key={client.id}
                  value={client.id}
                >
                  {client.trade_name}
                  {client.status === "inactive"
                    ? " (inativo)"
                    : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            error={state.fieldErrors?.name}
            id="name"
            label="Nome do contrato"
            required
          >
            <Input
              defaultValue={contract?.name ?? ""}
              maxLength={160}
              name="name"
            />
          </Field>
        </div>
      </section>

      <section
        aria-labelledby="contract-period-heading"
        className="border-t border-border-default pt-8"
      >
        <div>
          <h2 className="font-semibold" id="contract-period-heading">
            Período
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Informe quando o contrato começa e, quando aplicável, sua data de término.
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
              defaultValue={contract?.start_date ?? ""}
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
              defaultValue={contract?.end_date ?? ""}
              name="end_date"
              type="date"
            />
          </Field>
        </div>
      </section>

      <section
        aria-labelledby="contract-reference-heading"
        className="border-t border-border-default pt-8"
      >
        <div>
          <h2 className="font-semibold" id="contract-reference-heading">
            Referência
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Registre uma identificação externa quando este contrato também existir em outro sistema ou documento.
          </p>
        </div>

        <div className="mt-5">
          <Field
            error={state.fieldErrors?.external_reference}
            id="external_reference"
            label="Referência externa"
            optional
          >
            <Input
              defaultValue={contract?.external_reference ?? ""}
              maxLength={160}
              name="external_reference"
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
            : contract
              ? "Salvar alterações"
              : "Cadastrar contrato"}
        </Button>
      </div>
    </form>
  );
}