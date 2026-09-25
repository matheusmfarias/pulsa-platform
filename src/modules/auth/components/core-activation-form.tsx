"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/shared/db/supabase/browser";

import {
  resendCoreActivationAction,
  type ActivationActionState,
  verifyCoreActivationAction,
} from "../activation-actions";

const initialState: ActivationActionState = { error: null };

export function CoreActivationForm() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/activate/password");
    });
  }, [router]);
  const [state, formAction, pending] = useActionState(verifyCoreActivationAction, initialState);
  const [resendState, resendAction, resending] = useActionState(resendCoreActivationAction, initialState);
  return (
    <form action={formAction} className="mt-7 space-y-5" onReset={(event) => event.preventDefault()}>
      <Field id="activation-email" label="E-mail do convite" required>
        <Input autoComplete="email" name="email" type="email" />
      </Field>
      <Field
        id="activation-code"
        label="Código recebido por e-mail"
        optional
        description="Para reenviar o código, basta informar o e-mail acima."
      >
        <Input autoComplete="one-time-code" inputMode="numeric" maxLength={8} name="token" />
      </Field>
      {state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}
      {resendState.error ? <FeedbackMessage variant="danger">{resendState.error}</FeedbackMessage> : null}
      {resendState.success ? <FeedbackMessage variant="success">{resendState.success}</FeedbackMessage> : null}
      <Button className="w-full" disabled={pending || resending} type="submit">{pending ? "Confirmando…" : "Confirmar código"}</Button>
      <Button className="w-full" disabled={pending || resending} formAction={resendAction} type="submit" variant="outline">
        {resending ? "Enviando…" : "Enviar novo código"}
      </Button>
      <Button asChild className="w-full" variant="ghost"><Link href="/">Voltar ao login</Link></Button>
    </form>
  );
}
