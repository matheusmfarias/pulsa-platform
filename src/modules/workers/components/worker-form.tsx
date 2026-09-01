"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createWorkerAction,
  type WorkerActionState,
  updateWorkerAction,
} from "../actions";
import { formatCpf } from "../domain/document-number";
import type { Worker } from "../domain/worker";

const initialState: WorkerActionState = { error: null };

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function WorkerForm({ worker }: { worker?: Worker }) {
  const action = worker
    ? updateWorkerAction.bind(null, worker.id)
    : createWorkerAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={worker?.full_name}
          maxLength={160}
          required
          aria-invalid={Boolean(state.fieldErrors?.full_name)}
        />
        <FieldError errors={state.fieldErrors?.full_name} id="name-error" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="document_number">CPF</Label>
        <Input
          id="document_number"
          name="document_number"
          inputMode="numeric"
          defaultValue={worker ? formatCpf(worker.document_number) : undefined}
          placeholder="000.000.000-00"
          required
          aria-invalid={Boolean(state.fieldErrors?.document_number)}
        />
        <p className="text-xs text-muted-foreground">
          A pontuação é removida antes do armazenamento.
        </p>
        <FieldError
          errors={state.fieldErrors?.document_number}
          id="document-error"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={worker?.email ?? ""}
            maxLength={254}
          />
          <FieldError errors={state.fieldErrors?.email} id="email-error" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={worker?.phone ?? ""}
            maxLength={30}
          />
          <FieldError errors={state.fieldErrors?.phone} id="phone-error" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="engagement_start_date">Início do vínculo</Label>
          <Input
            id="engagement_start_date"
            name="engagement_start_date"
            type="date"
            defaultValue={worker?.engagement_start_date ?? ""}
          />
          <FieldError
            errors={state.fieldErrors?.engagement_start_date}
            id="start-date-error"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="engagement_end_date">Fim do vínculo</Label>
          <Input
            id="engagement_end_date"
            name="engagement_end_date"
            type="date"
            defaultValue={worker?.engagement_end_date ?? ""}
          />
          <FieldError
            errors={state.fieldErrors?.engagement_end_date}
            id="end-date-error"
          />
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
            : worker
              ? "Salvar alterações"
              : "Cadastrar colaborador"}
        </Button>
      </div>
    </form>
  );
}
