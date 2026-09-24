"use client";

import { useActionState, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePreservedActionState } from "@/shared/forms/use-preserved-action-state";

import type { WorkerAccessAdministration } from "../domain/worker-access";
import {
  provisionWorkerAccessAction,
  resumeWorkerAccessAction,
  revokeWorkerAccessAction,
  revokeWorkerInvitationAction,
  suspendWorkerAccessAction,
  type WorkerAccessActionState,
} from "../actions";

const initialState: WorkerAccessActionState = { error: null };

function Result({ state }: { state: WorkerAccessActionState }) {
  if (!state.error && !state.success) return null;
  return (
    <FeedbackMessage variant={state.error ? "danger" : "success"}>
      {state.error ?? state.success}
    </FeedbackMessage>
  );
}

function ReasonAction({
  action,
  description,
  destructive = false,
  label,
}: {
  action: (state: WorkerAccessActionState, data: FormData) => Promise<WorkerAccessActionState>;
  description: string;
  destructive?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const reasonId = useId();
  const [state, formAction, pending, preservationRef, preservationSubmit, preservationReset] = usePreservedActionState(
    async (previousState: WorkerAccessActionState, formData: FormData) => {
      const result = await action(previousState, formData);
      if (result.success) setOpen(false);
      return result;
    },
    initialState,
  );

  return (
    <div>
      <Button onClick={() => setOpen(true)} type="button" variant={destructive ? "destructive" : "outline"}>
        {label}
      </Button>
      {!open && state.success ? <div className="mt-3"><Result state={state} /></div> : null}
      {open ? (
        <Dialog description={description} onOpenChange={setOpen} open={open} title={label}>
          <form action={formAction} className="space-y-5" onReset={preservationReset} onSubmit={preservationSubmit} ref={preservationRef}>
            <Field id={reasonId} label="Motivo" required>
              <Textarea maxLength={1000} name="reason" rows={4} />
            </Field>
            {state.error ? <Result state={state} /> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button disabled={pending} onClick={() => setOpen(false)} type="button" variant="ghost">Voltar</Button>
              <Button disabled={pending} type="submit" variant={destructive ? "destructive" : "default"}>
                {pending ? "Salvando…" : `Confirmar: ${label.toLowerCase()}`}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}

export function WorkerAccessAdministrationPanel({
  workerId,
  workerEmail,
  access,
}: {
  workerId: string;
  workerEmail: string | null;
  access: WorkerAccessAdministration;
}) {
  const [provisionState, provisionAction, provisioning, provisionPreservationRef, provisionPreservationSubmit, provisionPreservationReset] = usePreservedActionState(
    provisionWorkerAccessAction.bind(null, workerId),
    initialState,
  );
  const [resumeState, resumeAction, resuming] = useActionState(
    resumeWorkerAccessAction.bind(null, workerId),
    initialState,
  );

  if (!access.linkStatus && access.invitationStatus !== "pending") {
    return (
      <form action={provisionAction} className="max-w-lg space-y-4" onReset={provisionPreservationReset} onSubmit={provisionPreservationSubmit} ref={provisionPreservationRef}>
        <div className="space-y-2">
          <Label htmlFor="worker-access-email">E-mail para o convite</Label>
          <Input
            defaultValue={workerEmail ?? ""}
            id="worker-access-email"
            name="email"
            type="email"
            required
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Confirme que o colaborador pode receber o convite neste endereço. O acesso será associado a este cadastro.
          </p>
        </div>
        <Result state={provisionState} />
        <Button disabled={provisioning} type="submit">
          {provisioning ? "Enviando convite…" : "Criar acesso e enviar convite"}
        </Button>
      </form>
    );
  }

  if (!access.linkStatus && access.invitationStatus === "pending") {
    return (
      <div className="space-y-4">
        <p className="text-sm">
          Convite pendente para <strong>{access.invitationEmail}</strong>.
        </p>
        {access.invitationId ? (
          <ReasonAction
            action={revokeWorkerInvitationAction.bind(null, workerId, access.invitationId)}
            description="O convite deixará de ser válido. Informe o motivo para registrar esta decisão."
            destructive
            label="Revogar convite"
          />
        ) : null}
      </div>
    );
  }

  if (access.linkStatus === "revoked") {
    return <p className="text-sm text-muted-foreground">Acesso revogado. O histórico do colaborador foi preservado.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Estado atual: <strong>{access.linkStatus === "active" ? "ativo" : "suspenso"}</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        {access.linkStatus === "active" ? (
          <ReasonAction
            action={suspendWorkerAccessAction.bind(null, workerId)}
            description="O colaborador perderá temporariamente o acesso ao Pulsa Worker. Informe o motivo para registrar esta decisão."
            label="Suspender acesso"
          />
        ) : (
          <form action={resumeAction}>
            <Button disabled={resuming} type="submit" variant="outline">{resuming ? "Reativando…" : "Reativar acesso"}</Button>
          </form>
        )}
        <ReasonAction
          action={revokeWorkerAccessAction.bind(null, workerId)}
          description="O acesso será revogado definitivamente. O histórico operacional permanecerá disponível. Informe o motivo para registrar esta decisão."
          destructive
          label="Revogar acesso"
        />
      </div>
      <Result state={resumeState} />
    </div>
  );
}
