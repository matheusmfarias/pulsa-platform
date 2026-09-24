"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DrawerBody,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  createWorkerAction,
  createWorkerInDrawerAction,
  type WorkerActionState,
  updateWorkerAction,
} from "../actions";
import { formatCpf } from "../domain/document-number";
import type { Worker } from "../domain/worker";
import { usePreservedActionState } from "@/shared/forms/use-preserved-action-state";
import {
  formatBrazilianPhoneInput,
  formatCpfInput,
} from "./worker-input-masks";

const initialState: WorkerActionState = { error: null };

function IdentificationFields({
  autoFocus,
  state,
  worker,
}: {
  autoFocus: boolean;
  state: WorkerActionState;
  worker?: Worker;
}) {
  return (
    <div className="mt-5 space-y-5">
      <Field
        error={state.fieldErrors?.full_name}
        id="full_name"
        label="Nome completo"
        required
      >
        <Input
          autoComplete="name"
          autoFocus={autoFocus}
          defaultValue={worker?.full_name}
          maxLength={160}
          name="full_name"
        />
      </Field>

      <Field
        error={state.fieldErrors?.document_number}
        id="document_number"
        label="CPF"
        required
      >
        <Input
          defaultValue={worker ? formatCpf(worker.document_number) : undefined}
          inputMode="numeric"
          maxLength={14}
          name="document_number"
          onChange={(event) => {
            event.currentTarget.value = formatCpfInput(event.currentTarget.value);
          }}
          placeholder="000.000.000-00"
        />
      </Field>
    </div>
  );
}

function ContactFields({
  state,
  twoColumns,
  worker,
}: {
  state: WorkerActionState;
  twoColumns: boolean;
  worker?: Worker;
}) {
  return (
    <div className={twoColumns ? "grid gap-5 sm:grid-cols-2" : "grid gap-5"}>
      <Field error={state.fieldErrors?.email} id="email" label="E-mail" optional>
        <Input
          autoComplete="email"
          defaultValue={worker?.email ?? ""}
          maxLength={254}
          name="email"
          type="email"
        />
      </Field>
      <Field error={state.fieldErrors?.phone} id="phone" label="Telefone" optional>
        <Input
          autoComplete="tel"
          defaultValue={worker?.phone ?? ""}
          maxLength={30}
          name="phone"
          onChange={(event) => {
            event.currentTarget.value = formatBrazilianPhoneInput(
              event.currentTarget.value,
            );
          }}
          placeholder="(00) 00000-0000"
          type="tel"
        />
      </Field>
    </div>
  );
}

function EngagementFields({
  state,
  twoColumns,
  worker,
}: {
  state: WorkerActionState;
  twoColumns: boolean;
  worker?: Worker;
}) {
  return (
    <div className={twoColumns ? "grid gap-5 sm:grid-cols-2" : "grid gap-5"}>
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
  );
}

function WorkerFormSections({
  drawer,
  state,
  worker,
}: {
  drawer: boolean;
  state: WorkerActionState;
  worker?: Worker;
}) {
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold">Identificação</legend>
        <p className="mt-1 text-xs leading-4 text-muted-foreground/85">
          Dados usados para localizar e identificar o colaborador.
        </p>
        <IdentificationFields autoFocus={drawer} state={state} worker={worker} />
      </fieldset>

      {drawer ? (
        <>
          <fieldset className="border-t border-border-default pt-5">
            <legend className="px-1 text-sm font-semibold">Contato</legend>
            <p className="mt-1 text-xs leading-4 text-muted-foreground/85">
              Canais opcionais para contato com a pessoa.
            </p>
            <div className="mt-5">
              <ContactFields state={state} twoColumns={false} worker={worker} />
            </div>
          </fieldset>

          <fieldset className="border-t border-border-default pt-5">
            <legend className="px-1 text-sm font-semibold">Vínculo</legend>
            <p className="mt-1 text-xs leading-4 text-muted-foreground/85">
              Período opcional do relacionamento com a organização.
            </p>
            <div className="mt-5">
              <EngagementFields state={state} twoColumns={false} worker={worker} />
            </div>
          </fieldset>
        </>
      ) : (
        <fieldset className="border-t border-border-default pt-6">
          <legend className="px-1 text-sm font-semibold">Contato e vínculo</legend>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Informações complementares para contato e período de relacionamento.
          </p>
          <div className="mt-5 space-y-5">
            <ContactFields state={state} twoColumns worker={worker} />
            <EngagementFields state={state} twoColumns worker={worker} />
          </div>
        </fieldset>
      )}

      {state.error ? (
        <FeedbackMessage variant="danger">{state.error}</FeedbackMessage>
      ) : null}
    </div>
  );
}

function SubmitButton({ pending, worker }: { pending: boolean; worker?: Worker }) {
  return (
    <Button disabled={pending} type="submit">
      {pending
        ? "Salvando…"
        : worker
          ? "Salvar alterações"
          : "Cadastrar colaborador"}
    </Button>
  );
}

export function WorkerForm({
  worker,
  cancelHref = "/app/workers",
  createReturnHref,
  onDirtyChange,
  presentation = "page",
}: {
  worker?: Worker;
  cancelHref?: string;
  createReturnHref?: string;
  onDirtyChange?: (dirty: boolean) => void;
  presentation?: "page" | "drawer";
}) {
  const action = worker
    ? updateWorkerAction.bind(null, worker.id)
    : createReturnHref
      ? createWorkerInDrawerAction.bind(null, createReturnHref)
      : createWorkerAction;
  const [state, formAction, pending, preservationRef, preservationSubmit, preservationReset] = usePreservedActionState(action, initialState);
  const formRef = preservationRef;
  const initialSnapshotRef = React.useRef<string | null>(null);
  const drawer = presentation === "drawer";

  const readSnapshot = React.useCallback(() => {
    const form = formRef.current;
    if (!form) return "";
    return JSON.stringify(
      Array.from(new FormData(form).entries()).map(([key, value]) => [
        key,
        String(value),
      ]),
    );
  }, [formRef]);

  React.useEffect(() => {
    initialSnapshotRef.current = readSnapshot();
    onDirtyChange?.(false);
  }, [formRef, onDirtyChange, readSnapshot]);

  React.useEffect(() => {
    if (!state.fieldErrors) return;
    const firstInvalidField =
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    firstInvalidField?.focus();
  }, [formRef, state.fieldErrors]);

  if (drawer) {
    return (
      <form
        action={formAction}
        className="flex min-h-0 flex-1 flex-col"
        noValidate
        onReset={preservationReset}
        onSubmit={preservationSubmit}
        onInput={() => {
          queueMicrotask(() => {
            onDirtyChange?.(readSnapshot() !== initialSnapshotRef.current);
          });
        }}
        ref={formRef}
      >
        <DrawerBody>
          <WorkerFormSections drawer state={state} worker={worker} />
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose variant="ghost">Cancelar</DrawerClose>
          <SubmitButton pending={pending} worker={worker} />
        </DrawerFooter>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate onReset={preservationReset} onSubmit={preservationSubmit} ref={formRef}>
      <WorkerFormSections drawer={false} state={state} worker={worker} />
      <div className="flex flex-col-reverse gap-2 border-t border-border-default pt-6 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
        <SubmitButton pending={pending} worker={worker} />
      </div>
    </form>
  );
}
