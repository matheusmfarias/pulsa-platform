import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const testUrl = process.env.SUPABASE_TEST_URL;
const testPublishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const testServiceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const enabled = Boolean(
  testUrl &&
    testPublishableKey &&
    testServiceRoleKey &&
    process.env.SUPABASE_TEST_CONFIRMATION === "integration-test",
);

test("creates a Worker through the authenticated list drawer", async ({ page }) => {
  test.skip(!enabled, "Requires explicit SUPABASE_TEST_* integration environment.");
  test.setTimeout(90_000);

  const admin = createClient(testUrl!, testServiceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const marker = randomUUID();
  const email = `workers-ui-${marker}@example.invalid`;
  const password = randomUUID();
  const workerName = `Colaborador Teste ${marker.slice(0, 8)}`;
  let organizationId: string | undefined;
  let userId: string | undefined;

  try {
    const organization = await admin.from("organizations").insert({
      legal_name: `Workers UI ${marker} Ltda`,
      trade_name: `Workers UI ${marker.slice(0, 8)}`,
      status: "active",
    }).select("id").single();
    if (organization.error) throw organization.error;
    organizationId = organization.data.id;

    const createdUser = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createdUser.error) throw createdUser.error;
    userId = createdUser.data.user.id;

    const profile = await admin.from("profiles").insert({
      id: userId,
      display_name: "Workers UI Test",
    });
    if (profile.error) throw profile.error;
    const membership = await admin.from("organization_members").insert({
      organization_id: organizationId,
      profile_id: userId,
      role: "DIRECTOR",
      status: "active",
    });
    if (membership.error) throw membership.error;

    await page.goto("/");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/app(?:\/|$)/);
    await page.goto("/app/workers");
    await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.getByRole("link", { name: "Novo colaborador" }).first().click();
    const drawer = page.getByRole("dialog", { name: "Novo colaborador" });
    await expect(drawer).toBeVisible();
    await drawer.getByLabel("Nome completo").fill(workerName);
    await drawer.getByRole("button", { name: "Cancelar" }).click();
    const discard = page.getByRole("alertdialog", { name: "Descartar alterações?" });
    await expect(discard).toBeVisible();
    await discard.getByRole("button", { name: "Continuar editando" }).click();
    await expect(drawer).toBeVisible();

    await drawer.getByLabel("CPF").fill("529.982.247-25");
    await drawer.getByRole("button", { name: "Cadastrar colaborador" }).click();
    await expect(drawer).not.toBeVisible();
    await expect(page.getByText(workerName)).toBeVisible();
    await expect(page.getByText("Colaborador cadastrado")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.getByRole("searchbox", { name: "Buscar colaboradores por nome ou CPF" }).fill(workerName);
    await page.getByRole("button", { name: "Filtrar colaboradores por status" }).click();
    await page.getByRole("menuitemradio", { name: "Em onboarding" }).click();
    await expect(page).toHaveURL(/q=.*status=onboarding/);
    await expect(page.getByText(workerName)).toBeVisible();
    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page).toHaveURL(/\/app\/workers$/);

    await page.goto("/app/workers/new");
    await expect(page.getByRole("dialog", { name: "Novo colaborador" })).toBeVisible();
    await page.getByRole("button", { name: "Fechar novo colaborador" }).click();
    await expect(page).toHaveURL(/\/app\/workers$/);
  } finally {
    if (organizationId) {
      const auditCleanup = await admin.from("audit_events").delete().eq("organization_id", organizationId);
      if (auditCleanup.error) throw auditCleanup.error;
      const workerCleanup = await admin.from("workers").delete().eq("organization_id", organizationId);
      if (workerCleanup.error) throw workerCleanup.error;
    }
    if (userId) {
      const membershipCleanup = await admin.from("organization_members").delete().eq("profile_id", userId);
      if (membershipCleanup.error) throw membershipCleanup.error;
      const profileCleanup = await admin.from("profiles").delete().eq("id", userId);
      if (profileCleanup.error) throw profileCleanup.error;
      const userCleanup = await admin.auth.admin.deleteUser(userId);
      if (userCleanup.error) throw userCleanup.error;
    }
    if (organizationId) {
      const organizationCleanup = await admin.from("organizations").delete().eq("id", organizationId);
      if (organizationCleanup.error) throw organizationCleanup.error;
    }
  }
});
