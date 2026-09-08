"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <p className={state.error ? "text-sm text-destructive" : "text-sm text-emerald-700"} role="status">
      {state.error ?? state.success}
    </p>
  );
}

export function WorkerAccessAdministrationPanel({
  workerId,
  access,
}: {
  workerId: string;
  access: WorkerAccessAdministration;
}) {
  const [provisionState, provisionAction, provisioning] = useActionState(
    provisionWorkerAccessAction.bind(null, workerId),
    initialState,
  );
  const [suspendState, suspendAction, suspending] = useActionState(
    suspendWorkerAccessAction.bind(null, workerId),
    initialState,
  );
  const [resumeState, resumeAction, resuming] = useActionState(
    resumeWorkerAccessAction.bind(null, workerId),
    initialState,
  );
  const [revokeState, revokeAction, revoking] = useActionState(
    revokeWorkerAccessAction.bind(null, workerId),
    initialState,
  );
  const [invitationState, invitationAction, revokingInvitation] = useActionState(
    access.invitationId
      ? revokeWorkerInvitationAction.bind(null, workerId, access.invitationId)
      : async () => initialState,
    initialState,
  );

  if (!access.linkStatus && access.invitationStatus !== "pending") {
    return (
      <form action={provisionAction} className="max-w-lg space-y-4">
        <div className="space-y-2">
          <Label htmlFor="worker-access-email">E-mail confirmado para o convite</Label>
          <Input id="worker-access-email" name="email" type="email" required />
          <p className="text-xs leading-5 text-muted-foreground">
            A conta será ligada explicitamente a este colaborador. CPF e e-mail cadastral não são usados para associação automática.
          </p>
        </div>
        <Result state={provisionState} />
        <Button disabled={provisioning} type="submit">
          {provisioning ? "Provisionando…" : "Provisionar e convidar"}
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
        <form action={invitationAction} className="flex max-w-xl flex-col gap-3 sm:flex-row">
          <Input name="reason" placeholder="Motivo da revogação" required />
          <Button disabled={revokingInvitation} type="submit" variant="destructive">
            Revogar convite
          </Button>
        </form>
        <Result state={invitationState} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm">
        Estado atual: <strong>{access.linkStatus === "active" ? "ativo" : "suspenso"}</strong>
      </p>
      {access.linkStatus === "active" ? (
        <form action={suspendAction} className="flex max-w-xl flex-col gap-3 sm:flex-row">
          <Input name="reason" placeholder="Motivo da suspensão" required />
          <Button disabled={suspending} type="submit" variant="outline">Suspender</Button>
        </form>
      ) : (
        <form action={resumeAction}>
          <Button disabled={resuming} type="submit" variant="outline">Reativar acesso</Button>
        </form>
      )}
      <Result state={access.linkStatus === "active" ? suspendState : resumeState} />
      <form action={revokeAction} className="flex max-w-xl flex-col gap-3 border-t pt-5 sm:flex-row">
        <Input name="reason" placeholder="Motivo da revogação definitiva" required />
        <Button disabled={revoking} type="submit" variant="destructive">Revogar acesso</Button>
      </form>
      <Result state={revokeState} />
    </div>
  );
}
