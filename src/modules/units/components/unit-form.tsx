"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { OperationWithContext } from "@/modules/operations";

import {
  createUnitAction,
  type UnitActionState,
  updateUnitAction,
} from "../actions";
import type { Unit } from "../domain/unit";

const initialState: UnitActionState = { error: null };

export function UnitForm({
  operations,
  unit,
  defaultOperationId,
  cancelHref,
}: {
  operations: OperationWithContext[];
  unit?: Unit;
  defaultOperationId?: string;
  cancelHref: string;
}) {
  const handler = unit
    ? updateUnitAction.bind(null, unit.id)
    : createUnitAction;

  const [state, action, pending] = useActionState(handler, initialState);

  return (
    <form action={action} className="space-y-8" noValidate>
      <section aria-labelledby="unit-context-heading">
        <div>
          <h2 className="font-semibold" id="unit-context-heading">
            Contexto operacional
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Defina a operação à qual esta unidade pertence e sua identificação.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field
            error={state.fieldErrors?.operation_id}
            id="operation_id"
            label="Operação"
            required
          >
            <Select
              defaultValue={
                unit?.operation_id ?? defaultOperationId ?? ""
              }
              name="operation_id"
            >
              <option disabled value="">
                Selecione uma operação
              </option>

              {operations.map((operation) => (
                <option
                  disabled={
                    operation.status === "closed" &&
                    operation.id !== unit?.operation_id
                  }
                  key={operation.id}
                  value={operation.id}
                >
                  {operation.contract.client.trade_name} — {operation.name}
                  {operation.status === "closed" ? " (encerrada)" : ""}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              error={state.fieldErrors?.name}
              id="name"
              label="Nome"
              required
            >
              <Input
                defaultValue={unit?.name ?? ""}
                maxLength={160}
                name="name"
              />
            </Field>

            <Field
              error={state.fieldErrors?.code}
              id="code"
              label="Código"
              optional
            >
              <Input
                defaultValue={unit?.code ?? ""}
                maxLength={40}
                name="code"
              />
            </Field>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="unit-location-heading"
        className="border-t border-border-default pt-8"
      >
        <div>
          <h2 className="font-semibold" id="unit-location-heading">
            Localização
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Informe os dados de localização usados para identificar a unidade.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field
            error={state.fieldErrors?.address}
            id="address"
            label="Endereço"
            optional
          >
            <Input
              autoComplete="street-address"
              defaultValue={unit?.address ?? ""}
              maxLength={300}
              name="address"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              error={state.fieldErrors?.city}
              id="city"
              label="Cidade"
              optional
            >
              <Input
                autoComplete="address-level2"
                defaultValue={unit?.city ?? ""}
                maxLength={120}
                name="city"
              />
            </Field>

            <Field
              error={state.fieldErrors?.state}
              id="state"
              label="Estado"
              optional
            >
              <Input
                autoComplete="address-level1"
                defaultValue={unit?.state ?? ""}
                maxLength={80}
                name="state"
              />
            </Field>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="unit-settings-heading"
        className="border-t border-border-default pt-8"
      >
        <div>
          <h2 className="font-semibold" id="unit-settings-heading">
            Configuração
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Defina o fuso horário usado como referência operacional desta unidade.
          </p>
        </div>

        <div className="mt-5">
          <Field
            description="Use um identificador IANA, como America/Sao_Paulo."
            error={state.fieldErrors?.timezone}
            id="timezone"
            label="Fuso horário"
            required
          >
            <Input
              defaultValue={unit?.timezone ?? "America/Sao_Paulo"}
              maxLength={100}
              name="timezone"
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
            : unit
              ? "Salvar alterações"
              : "Cadastrar unidade"}
        </Button>
      </div>
    </form>
  );
}