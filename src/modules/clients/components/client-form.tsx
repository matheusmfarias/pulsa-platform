"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  createClientAction,
  type ClientActionState,
  updateClientAction,
} from "../actions";
import type { Client } from "../domain/client";
import { formatDocumentNumber } from "../domain/document-number";

const initialState: ClientActionState = { error: null };

export function ClientForm({
  client,
  cancelHref,
}: {
  client?: Client;
  cancelHref: string;
}) {
  const action = client
    ? updateClientAction.bind(null, client.id)
    : createClientAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <section aria-labelledby="client-identification-heading">
        <div>
          <h2 className="font-semibold" id="client-identification-heading">
            Identificação da empresa
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Informe os dados jurídicos e comerciais usados para identificar o cliente.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field
            error={state.fieldErrors?.legal_name}
            id="legal_name"
            label="Razão social"
            required
          >
            <Input
              autoComplete="organization"
              defaultValue={client?.legal_name ?? ""}
              maxLength={160}
              name="legal_name"
            />
          </Field>

          <Field
            error={state.fieldErrors?.trade_name}
            id="trade_name"
            label="Nome fantasia"
            required
          >
            <Input
              defaultValue={client?.trade_name ?? ""}
              maxLength={160}
              name="trade_name"
            />
          </Field>

          <Field
            description="A pontuação pode ser informada normalmente e é removida antes do armazenamento."
            error={state.fieldErrors?.document_number}
            id="document_number"
            label="CNPJ"
            required
          >
            <Input
              defaultValue={
                client
                  ? formatDocumentNumber(client.document_number)
                  : ""
              }
              inputMode="numeric"
              name="document_number"
              placeholder="00.000.000/0000-00"
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
            : client
              ? "Salvar alterações"
              : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}