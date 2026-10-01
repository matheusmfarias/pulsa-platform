"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/shared/db/supabase/browser";

import { activationPasswordSchema } from "../schemas/activation-schema";
import { completeCoreActivationAction } from "../activation-actions";

export function CoreActivationPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = activationPasswordSchema.safeParse({
      password: data.get("password"),
      passwordConfirmation: data.get("passwordConfirmation"),
    });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? "Revise a senha.");
      return;
    }
    setPending(true);
    setError(null);
    const { error: updateError } = await createBrowserSupabaseClient().auth.updateUser({ password: input.data.password });
    if (updateError) {
      setError("Não foi possível salvar a senha. Tente novamente.");
      setPending(false);
      return;
    }
    const completion = await completeCoreActivationAction();
    if (completion.error) {
      setError(completion.error);
      setPending(false);
      return;
    }
    router.replace("/app");
    router.refresh();
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={submit}>
      <Field id="activation-password" label="Nova senha" description="Use pelo menos 8 caracteres." required>
        <Input autoComplete="new-password" minLength={8} name="password" type="password" />
      </Field>
      <Field id="activation-password-confirmation" label="Confirmar senha" required>
        <Input autoComplete="new-password" minLength={8} name="passwordConfirmation" type="password" />
      </Field>
      {error ? <FeedbackMessage variant="danger">{error}</FeedbackMessage> : null}
      <Button className="w-full" disabled={pending} type="submit">{pending ? "Salvando…" : "Ativar meu acesso"}</Button>
    </form>
  );
}
