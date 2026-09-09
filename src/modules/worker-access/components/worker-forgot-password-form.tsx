"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  requestWorkerPasswordResetAction,
  type WorkerAccessActionState,
} from "../actions";

const initialState: WorkerAccessActionState = { error: null };

export function WorkerForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestWorkerPasswordResetAction,
    initialState,
  );

  if (state.success) {
    return (
      <p className="mt-6 rounded-lg border bg-muted/40 p-4 text-sm leading-6" role="status">
        {state.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-7 space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="worker-recovery-email">E-mail</Label>
        <Input
          id="worker-recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "worker-recovery-error" : undefined}
          className="h-12"
        />
      </div>
      {state.error ? (
        <p id="worker-recovery-error" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button className="h-12 w-full" disabled={pending} type="submit">
        {pending ? "Enviando instruções…" : "Recuperar senha"}
      </Button>
    </form>
  );
}
