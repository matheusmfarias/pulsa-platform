import { expect, test } from "@playwright/test";

test("renders the accessible login form", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("redirects an unauthenticated user away from clients", async ({ page }) => {
  await page.goto("/app/clients");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
});
