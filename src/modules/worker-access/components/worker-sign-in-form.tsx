"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  requestWorkerOtpAction,
  type WorkerAccessActionState,
  verifyWorkerOtpAction,
} from "../actions";

const initialState: WorkerAccessActionState = { error: null };

export function WorkerSignInForm({ invitationToken }: { invitationToken?: string }) {
  const [requestState, requestAction, requesting] = useActionState(
    requestWorkerOtpAction,
    initialState,
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyWorkerOtpAction,
    initialState,
  );

  if (requestState.otpRequested && requestState.email) {
    return (
      <form action={verifyAction} className="mt-8 space-y-5" noValidate>
        <input name="email" type="hidden" value={requestState.email} />
        <input name="invitation" type="hidden" value={invitationToken ?? ""} />
        <div className="space-y-2">
          <Label htmlFor="worker-token">Código de acesso</Label>
          <Input
            id="worker-token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            required
            autoFocus
            aria-invalid={Boolean(verifyState.error)}
          />
          <p className="text-sm text-muted-foreground">
            Código enviado para {requestState.email}.
          </p>
        </div>
        {verifyState.error ? (
          <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {verifyState.error}
          </p>
        ) : null}
        <Button className="w-full" disabled={verifying} type="submit">
          {verifying ? "Validando…" : "Continuar"}
        </Button>
      </form>
    );
  }

  return (
    <form action={requestAction} className="mt-8 space-y-5" noValidate>
      <input name="invitation" type="hidden" value={invitationToken ?? ""} />
      <div className="space-y-2">
        <Label htmlFor="worker-email">E-mail do convite</Label>
        <Input
          id="worker-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(requestState.error)}
        />
      </div>
      {requestState.error ? (
        <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {requestState.error}
        </p>
      ) : null}
      <Button className="w-full" disabled={requesting} type="submit">
        {requesting ? "Enviando…" : "Receber código"}
      </Button>
    </form>
  );
}
