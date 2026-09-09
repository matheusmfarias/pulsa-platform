"use client";

import { LogIn, LogOut } from "lucide-react";
import { useActionState, useRef } from "react";

import { Button } from "@/components/ui/button";

import {
  workerCompletePresenceAction,
  workerStartPresenceAction,
} from "../actions";
import type {
  WorkerPresenceAction as PresenceAction,
  WorkerPresenceActionState,
} from "../domain/worker-presence";

const initialState: WorkerPresenceActionState = { error: null };

function PresenceForm({
  action,
  scheduleEntryId,
}: {
  action: PresenceAction;
  scheduleEntryId: string;
}) {
  const idempotencyKey = useRef<string | null>(null);
  const sourceReference = useRef<string | null>(null);
  const serverAction = action === "start"
    ? workerStartPresenceAction.bind(null, scheduleEntryId)
    : workerCompletePresenceAction.bind(null, scheduleEntryId);
  const [state, formAction, pending] = useActionState(
    serverAction,
    initialState,
  );

  function submit(formData: FormData) {
    idempotencyKey.current ??= globalThis.crypto.randomUUID();
    formData.set("idempotencyKey", idempotencyKey.current);
    if (action === "start") {
      sourceReference.current ??= globalThis.crypto.randomUUID();
      formData.set("sourceReference", sourceReference.current);
    }
    formAction(formData);
  }

  return (
    <div className="mt-5 border-t pt-5">
      <form action={submit}>
        <Button className="w-full sm:w-auto" disabled={pending} type="submit">
          {action === "start"
            ? <LogIn aria-hidden="true" className="size-4" />
            : <LogOut aria-hidden="true" className="size-4" />}
          {pending
            ? "Registrando…"
            : action === "start"
              ? "Registrar chegada"
              : "Registrar saída"}
        </Button>
      </form>
      <p aria-live="polite" className="mt-2 text-sm">
        {state.error ? (
          <span className="text-status-danger-foreground">{state.error}</span>
        ) : state.success ? (
          <span className="text-muted-foreground">Registro atualizado.</span>
        ) : null}
      </p>
    </div>
  );
}

export function WorkerPresenceControl({
  action,
  scheduleEntryId,
}: {
  action: PresenceAction | null;
  scheduleEntryId: string;
}) {
  if (!action) return null;
  return <PresenceForm action={action} scheduleEntryId={scheduleEntryId} />;
}
