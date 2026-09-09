"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/shared/db/supabase/browser";

import { workerPasswordUpdateSchema } from "../schemas/worker-access-schemas";

export type WorkerPasswordFormMode = "create" | "change" | "reset";

export function getWorkerPasswordFormOptions(mode: WorkerPasswordFormMode) {
  if (mode === "change") {
    return {
      redirectTo: "/worker/account",
      submitLabel: "Salvar nova senha",
    };
  }

  if (mode === "reset") {
    return {
      redirectTo: "/worker/sign-in",
      submitLabel: "Salvar e continuar",
    };
  }

  return {
    redirectTo: "/worker",
    submitLabel: "Salvar e continuar",
  };
}

export function WorkerPasswordForm({ mode }: { mode: WorkerPasswordFormMode }) {
  const router = useRouter();
  const options = getWorkerPasswordFormOptions(mode);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const parsed = workerPasswordUpdateSchema.safeParse({
      password: formData.get("password"),
      passwordConfirmation: formData.get("passwordConfirmation"),
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Revise as senhas informadas.",
      );
      return;
    }

    setPending(true);

    const supabase = createBrowserSupabaseClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (updateError) {
      setPending(false);
      setError(
        mode !== "reset" && updateError.code === "same_password"
          ? "A nova senha deve ser diferente da senha atual."
          : mode === "reset"
            ? "Este link é inválido ou expirou. Solicite uma nova recuperação."
            : "Não foi possível salvar sua senha. Tente novamente.",
      );
      return;
    }

    if (mode === "reset") {
      await supabase.auth.signOut({ scope: "local" });
    }
    router.replace(options.redirectTo);
    router.refresh();
  }

  return (
    <form className="mt-7 space-y-5" noValidate onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-worker-password`}>Nova senha</Label>
        <Input
          id={`${mode}-worker-password`}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={`${mode}-worker-password-help`}
          className="h-12"
        />
        <p
          id={`${mode}-worker-password-help`}
          className="text-xs text-muted-foreground"
        >
          Use pelo menos 8 caracteres.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-worker-password-confirmation`}>
          Confirmar senha
        </Label>
        <Input
          id={`${mode}-worker-password-confirmation`}
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(error)}
          className="h-12"
        />
      </div>
      <p aria-live="polite" className="min-h-5 text-sm">
        {error ? <span className="text-destructive">{error}</span> : null}
      </p>
      <Button className="h-12 w-full" disabled={pending} type="submit">
        {pending ? "Salvando…" : options.submitLabel}
      </Button>
    </form>
  );
}
