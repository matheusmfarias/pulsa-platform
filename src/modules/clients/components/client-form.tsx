"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createClientAction,
  type ClientActionState,
  updateClientAction,
} from "../actions";
import type { Client } from "../domain/client";
import { formatDocumentNumber } from "../domain/document-number";

const initialState: ClientActionState = { error: null };

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;

  return (
    <p id={id} className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function ClientForm({ client }: { client?: Client }) {
  const action = client
    ? updateClientAction.bind(null, client.id)
    : createClientAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="legal_name">Razão social</Label>
        <Input
          id="legal_name"
          name="legal_name"
          defaultValue={client?.legal_name}
          maxLength={160}
          required
          aria-invalid={Boolean(state.fieldErrors?.legal_name)}
          aria-describedby={state.fieldErrors?.legal_name ? "legal-name-error" : undefined}
        />
        <FieldError errors={state.fieldErrors?.legal_name} id="legal-name-error" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trade_name">Nome fantasia</Label>
        <Input
          id="trade_name"
          name="trade_name"
          defaultValue={client?.trade_name}
          maxLength={160}
          required
          aria-invalid={Boolean(state.fieldErrors?.trade_name)}
          aria-describedby={state.fieldErrors?.trade_name ? "trade-name-error" : undefined}
        />
        <FieldError errors={state.fieldErrors?.trade_name} id="trade-name-error" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="document_number">CNPJ</Label>
        <Input
          id="document_number"
          name="document_number"
          inputMode="numeric"
          defaultValue={client ? formatDocumentNumber(client.document_number) : undefined}
          placeholder="00.000.000/0000-00"
          required
          aria-invalid={Boolean(state.fieldErrors?.document_number)}
          aria-describedby={
            state.fieldErrors?.document_number
              ? "document-number-error"
              : "document-number-hint"
          }
        />
        <p id="document-number-hint" className="text-xs text-muted-foreground">
          A pontuação é removida antes do armazenamento.
        </p>
        <FieldError
          errors={state.fieldErrors?.document_number}
          id="document-number-error"
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
          {pending ? "Salvando…" : client ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
