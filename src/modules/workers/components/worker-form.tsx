"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  createWorkerAction,
  type WorkerActionState,
  updateWorkerAction,
} from "../actions";
import { formatCpf } from "../domain/document-number";
import type { Worker } from "../domain/worker";

const initialState: WorkerActionState = { error: null };

export function WorkerForm({
  worker,
  cancelHref = "/app/workers",
}: {
  worker?: Worker;
  cancelHref?: string;
}) {
  const action = worker
    ? updateWorkerAction.bind(null, worker.id)
    : createWorkerAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold">Identificação</legend>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Dados usados para localizar e identificar o colaborador.
        </p>
        <div className="mt-5 space-y-5">
          <Field
            error={state.fieldErrors?.full_name}
            id="full_name"
            label="Nome completo"
            required
          >
            <Input
              autoComplete="name"
              defaultValue={worker?.full_name}
              maxLength={160}
              name="full_name"
            />
          </Field>

          <Field
            description="A pontuação é removida antes do armazenamento."
            error={state.fieldErrors?.document_number}
            id="document_number"
            label="CPF"
            required
          >
            <Input
              defaultValue={worker ? formatCpf(worker.document_number) : undefined}
              inputMode="numeric"
              name="document_number"
              placeholder="000.000.000-00"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="border-t border-border-default pt-6">
        <legend className="px-1 text-sm font-semibold">Contato e vínculo</legend>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Informações complementares para contato e período de relacionamento.
        </p>
        <div className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              error={state.fieldErrors?.email}
              id="email"
              label="E-mail"
              optional
            >
              <Input
                autoComplete="email"
                defaultValue={worker?.email ?? ""}
                maxLength={254}
                name="email"
                type="email"
              />
            </Field>
            <Field
              error={state.fieldErrors?.phone}
              id="phone"
              label="Telefone"
              optional
            >
              <Input
                autoComplete="tel"
                defaultValue={worker?.phone ?? ""}
                maxLength={30}
                name="phone"
                type="tel"
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              error={state.fieldErrors?.engagement_start_date}
              id="engagement_start_date"
              label="Início do vínculo"
              optional
            >
              <Input
                defaultValue={worker?.engagement_start_date ?? ""}
                name="engagement_start_date"
                type="date"
              />
            </Field>
            <Field
              error={state.fieldErrors?.engagement_end_date}
              id="engagement_end_date"
              label="Fim do vínculo"
              optional
            >
              <Input
                defaultValue={worker?.engagement_end_date ?? ""}
                name="engagement_end_date"
                type="date"
              />
            </Field>
          </div>
        </div>
      </fieldset>

      {state.error ? (
        <FeedbackMessage variant="danger">{state.error}</FeedbackMessage>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t border-border-default pt-6 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando…"
            : worker
              ? "Salvar alterações"
              : "Cadastrar colaborador"}
        </Button>
      </div>
    </form>
  );
}
