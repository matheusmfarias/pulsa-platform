import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getWorkerPasswordFormOptions } from "@/modules/worker-access/components/worker-password-form";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

const migration = source(
  "supabase/migrations/20260909120000_worker_auth_hardening.sql",
);
const phase7CleanupMigration = source(
  "supabase/migrations/20260909150000_phase7_cleanup.sql",
);

describe("Worker Auth hardening", () => {
  it("adds auth.uid-only claim RPCs without replacing token entry points", () => {
    expect(migration).toContain(
      "function public.get_my_pending_worker_access_claim()",
    );
    expect(migration).toContain("function public.claim_my_worker_access()");
    expect(migration).toContain("invitation.auth_user_id = auth.uid()");
    expect(migration).toContain("actor_id uuid := auth.uid()");
    expect(migration).toContain("function public.claim_worker_access(invitation_token text)");
    expect(migration).not.toMatch(/drop function[\s\S]*claim_worker_access/i);
    expect(migration).not.toContain("organization_members");
  });

  it("keeps claim eligibility, e-mail proof, uniqueness and atomic audit", () => {
    expect(migration).toContain("auth_user.email_confirmed_at is not null");
    expect(migration).toContain("lower(auth_user.email) = invitation.invitation_email");
    expect(migration).toContain("worker.status = 'active'");
    expect(migration).toContain("organization.status = 'active'");
    expect(migration).toContain("access_link.status in ('active', 'suspended')");
    expect(migration).toContain("insert into public.worker_access_links");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("private.claim_worker_access_core");
  });

  it("uses password by default and retains explicit OTP fallback", () => {
    const form = source(
      "src/modules/worker-access/components/worker-sign-in-form.tsx",
    );
    const actions = source("src/modules/worker-access/actions.ts");
    const authRepository = source(
      "src/modules/auth/repositories/supabase-auth-repository.ts",
    );

    expect(form).toContain("workerPasswordSignInAction");
    expect(form).toContain("Esqueci minha senha");
    expect(form).toContain("Entrar com código");
    expect(form).toContain("invitationToken || otpMode");
    expect(actions).toContain("await authenticate(parsed.data)");
    expect(authRepository).toContain("supabase.auth.signInWithPassword(input)");
  });

  it("removes the obsolete password-state RPC without removing access history", () => {
    expect(phase7CleanupMigration).toMatch(
      /drop function if exists public\.get_my_worker_password_state\(\);/,
    );
    expect(phase7CleanupMigration).not.toContain(
      "get_my_worker_access_history_state",
    );
  });

  it("validates password confirmation and uses Supabase recovery without enumeration", () => {
    const schemas = source(
      "src/modules/worker-access/schemas/worker-access-schemas.ts",
    );
    const passwordForm = source(
      "src/modules/worker-access/components/worker-password-form.tsx",
    );
    const repository = source(
      "src/modules/worker-access/repositories/worker-access-repository.ts",
    );
    const actions = source("src/modules/worker-access/actions.ts");

    expect(schemas).toContain('.min(8, "A senha deve ter pelo menos 8 caracteres.")');
    expect(schemas).toContain("value.password === value.passwordConfirmation");
    expect(passwordForm).toContain("supabase.auth.updateUser");
    expect(passwordForm).toContain('updateError.code === "same_password"');
    expect(passwordForm).toContain(
      "A nova senha deve ser diferente da senha atual.",
    );
    expect(repository).toContain("supabase.auth.resetPasswordForEmail(email, { redirectTo })");
    expect(actions).toContain(
      "Se houver uma conta para este e-mail, enviaremos as instruções.",
    );
  });

  it("separates initial password setup from authenticated password change", () => {
    const passwordLayout = source(
      "src/app/(worker-password)/worker/set-password/layout.tsx",
    );
    const passwordPage = source(
      "src/app/(worker-password)/worker/set-password/page.tsx",
    );
    const accountPage = source(
      "src/app/(worker-authenticated)/worker/account/page.tsx",
    );
    const accountPasswordPage = source(
      "src/app/(worker-authenticated)/worker/account/password/page.tsx",
    );
    const workerLayout = source(
      "src/app/(worker-authenticated)/worker/layout.tsx",
    );
    const oldPage = new URL(
      "../../src/app/(worker-authenticated)/worker/set-password/page.tsx",
      import.meta.url,
    );

    expect(existsSync(oldPage)).toBe(false);
    expect(passwordLayout).toContain("BrandMark");
    expect(passwordLayout).toContain("getAuthenticatedUser");
    expect(passwordLayout).toContain("requireWorkerAccess");
    expect(passwordLayout).not.toContain("WorkerNavigation");
    expect(passwordPage).not.toContain("WorkerNavigation");
    expect(passwordPage).toContain("Crie sua senha");
    expect(passwordPage).toContain('mode="create"');
    expect(accountPage).toContain('href="/worker/account/password"');
    expect(accountPage).not.toContain('href="/worker/set-password"');
    expect(accountPage).toContain("Alterar senha");
    expect(accountPasswordPage).toContain("Alterar senha");
    expect(accountPasswordPage).toContain('href="/worker/account"');
    expect(accountPasswordPage).toContain('mode="change"');
    expect(workerLayout).toContain("WorkerNavigation");
  });

  it("redirects each password form mode to its correct destination", () => {
    expect(getWorkerPasswordFormOptions("create")).toEqual({
      redirectTo: "/worker",
      submitLabel: "Salvar e continuar",
    });
    expect(getWorkerPasswordFormOptions("change")).toEqual({
      redirectTo: "/worker/account",
      submitLabel: "Salvar nova senha",
    });
    expect(getWorkerPasswordFormOptions("reset")).toEqual({
      redirectTo: "/worker/sign-in",
      submitLabel: "Salvar e continuar",
    });
  });

  it("handles unavailable WorkerAccess without hiding unexpected errors", () => {
    const handler = source(
      "src/modules/worker-access/services/handle-worker-route-error.ts",
    );
    const claimPage = source("src/app/(worker-public)/worker/claim/page.tsx");
    const schedulePage = source(
      "src/app/(worker-authenticated)/worker/schedule/page.tsx",
    );

    expect(handler).toContain('error.code === "AUTHORIZATION"');
    expect(handler).toContain('redirect("/worker/claim")');
    expect(handler).toContain("throw error");
    expect(schedulePage).toContain("withWorkerRouteAccess");
    expect(claimPage).toContain(
      "Seu acesso ao Pulsa Worker não está disponível.",
    );
    expect(claimPage).toContain("Procure o responsável pelo seu acesso.");
    expect(claimPage).toContain('href="/worker/sign-in"');
  });
});
