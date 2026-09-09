"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  requestWorkerOtpAction,
  type WorkerAccessActionState,
  verifyWorkerOtpAction,
  workerPasswordSignInAction,
} from "../actions";

const initialState: WorkerAccessActionState = { error: null };

export function WorkerSignInForm({
  invitationToken,
  otpMode = false,
}: {
  invitationToken?: string;
  otpMode?: boolean;
}) {
  const [passwordState, passwordAction, signingIn] = useActionState(
    workerPasswordSignInAction,
    initialState,
  );
  const [requestState, requestAction, requesting] = useActionState(
    requestWorkerOtpAction,
    initialState,
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyWorkerOtpAction,
    initialState,
  );

  if (invitationToken || otpMode) {
    return (
      <form action={verifyAction} className="mt-7 space-y-5" noValidate>
        <input name="invitation" type="hidden" value={invitationToken ?? ""} />
        <div className="space-y-2">
          <Label htmlFor="worker-code-email">
            {invitationToken ? "E-mail do convite" : "E-mail"}
          </Label>
          <Input
            id="worker-code-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={requestState.email}
            required
            aria-invalid={Boolean(verifyState.error || requestState.error)}
            aria-describedby={verifyState.error || requestState.error ? "worker-code-error" : undefined}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="worker-code-token">Código de acesso</Label>
          <Input
            id="worker-code-token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            pattern="[0-9]{8}"
            required
            aria-invalid={Boolean(verifyState.error)}
            aria-describedby={verifyState.error ? "worker-code-error" : undefined}
            className="h-14 text-center text-xl font-semibold tracking-[0.35em]"
          />
        </div>
        {verifyState.error || requestState.error ? (
          <p id="worker-code-error" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {verifyState.error ?? requestState.error}
          </p>
        ) : null}
        {requestState.success ? (
          <p aria-live="polite" className="rounded-md bg-muted/60 px-3 py-2 text-sm">
            {requestState.success}
          </p>
        ) : null}
        <Button className="h-12 w-full" disabled={verifying || requesting} type="submit">
          {verifying ? "Confirmando código…" : "Continuar"}
        </Button>
        <Button
          className="h-12 w-full"
          disabled={requesting || verifying}
          formAction={requestAction}
          type="submit"
          variant="outline"
        >
          {requesting ? "Enviando novo código…" : "Enviar novo código"}
        </Button>
        <Button asChild className="h-11 w-full" variant="ghost">
          <Link href="/worker/sign-in">Entrar com senha</Link>
        </Button>
      </form>
    );
  }

  return (
    <form action={passwordAction} className="mt-7 space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="worker-password-email">E-mail</Label>
        <Input
          id="worker-password-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(passwordState.error)}
          aria-describedby={passwordState.error ? "worker-password-login-error" : undefined}
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="worker-password">Senha</Label>
        <Input
          id="worker-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(passwordState.error)}
          aria-describedby={passwordState.error ? "worker-password-login-error" : undefined}
          className="h-12"
        />
      </div>
      {passwordState.error ? (
        <p id="worker-password-login-error" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {passwordState.error}
        </p>
      ) : null}
      <Button className="h-12 w-full" disabled={signingIn} type="submit">
        {signingIn ? "Entrando…" : "Entrar"}
      </Button>
      <div className="grid gap-1 text-center text-sm">
        <Link className="inline-flex min-h-11 items-center justify-center text-action-primary hover:underline" href="/worker/forgot-password">
          Esqueci minha senha
        </Link>
        <Link className="inline-flex min-h-11 items-center justify-center text-action-primary hover:underline" href="/worker/sign-in?mode=code">
          Entrar com código
        </Link>
      </div>
    </form>
  );
}
