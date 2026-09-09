import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

describe("Worker initial authentication flow", () => {
  it("opens a valid invitation directly in OTP verification mode", () => {
    const page = source("src/app/(worker-public)/worker/sign-in/page.tsx");
    const form = source(
      "src/modules/worker-access/components/worker-sign-in-form.tsx",
    );
    const codeMode = form.match(
      /if \(invitationToken \|\| otpMode\) \{([\s\S]*?)\n  \}\n\n  return \(/,
    )?.[1];

    expect(page).toContain("workerInvitationTokenSchema.safeParse");
    expect(page).toContain("Acesse seu convite");
    expect(page).toContain(
      "Informe o e-mail que recebeu o convite e o código enviado pela Pulsa.",
    );
    expect(codeMode).toBeDefined();
    expect(codeMode).toContain("action={verifyAction}");
    expect(codeMode).toContain("E-mail do convite");
    expect(codeMode).toContain("Código de acesso");
    expect(codeMode).toContain('name="invitation" type="hidden"');
  });

  it("accepts an existing OTP and keeps requesting a new one available", () => {
    const form = source(
      "src/modules/worker-access/components/worker-sign-in-form.tsx",
    );

    expect(form).toContain("invitationToken || otpMode");
    expect(form).toContain("action={verifyAction}");
    expect(form).toContain('pattern="[0-9]{8}"');
    expect(form).toContain('formAction={requestAction}');
    expect(form).toContain("Enviar novo código");
    expect(form).not.toContain("requestState.otpRequested");
  });

  it("preserves the invitation through verification and redirects to claim", () => {
    const actions = source("src/modules/worker-access/actions.ts");
    const repository = source(
      "src/modules/worker-access/repositories/worker-access-repository.ts",
    );

    expect(actions).toContain('formData.get("invitation")');
    expect(actions).toContain(
      "`/worker/claim?invitation=${encodeURIComponent(invitation.data)}`",
    );
    expect(repository).toContain(
      'verifyOtp({ email, token, type: "email" })',
    );
  });

  it("does not create recurring users or confirm provisioned users", () => {
    const repository = source(
      "src/modules/worker-access/repositories/worker-access-repository.ts",
    );
    const admin = source(
      "src/modules/worker-access/infrastructure/supabase-worker-auth-admin.ts",
    );
    const workerAuth = source(
      "src/modules/worker-access/services/worker-auth.ts",
    );

    expect(repository).toContain("shouldCreateUser: false");
    expect(admin).toContain("email_confirm: false");
    expect(workerAuth).toContain('new URL("/worker/sign-in", WORKER_APP_URL)');
    expect(workerAuth).toContain("signInUrl.toString()");
  });

  it("pins eight-digit OTP templates to Token and RedirectTo", () => {
    const config = source("supabase/config.toml");
    const template = source("supabase/templates/worker-auth.html");

    expect(config).toMatch(/\[auth\.email\][\s\S]*otp_length = 8/);
    expect(config).toContain('site_url = "http://localhost:3000"');
    expect(config).toContain('"http://localhost:3000/worker/sign-in**"');
    expect(config).toContain('"http://localhost:3000/worker/reset-password**"');
    expect(config).toMatch(
      /\[auth\.email\.template\.confirmation\][\s\S]*worker-auth\.html/,
    );
    expect(config).toMatch(
      /\[auth\.email\.template\.magic_link\][\s\S]*worker-auth\.html/,
    );
    expect(template).toContain("{{ .Token }}");
    expect(template).toContain("{{ .RedirectTo }}");
    expect(template).not.toContain("{{ .ConfirmationURL }}");
  });
});
