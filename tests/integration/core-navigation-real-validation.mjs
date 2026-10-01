import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

if (
  process.env.SUPABASE_TEST_CONFIRMATION !== "integration-test" ||
  process.env.SUPABASE_TEST_URL !== "https://jwylmqxogmdxceqtqyri.supabase.co" ||
  !process.env.SUPABASE_TEST_PUBLISHABLE_KEY ||
  !process.env.SUPABASE_TEST_SERVICE_ROLE_KEY
) {
  throw new Error("Explicit integration-test configuration for the development project is required.");
}

const baseUrl = "http://127.0.0.1:3000";
const admin = createClient(
  process.env.SUPABASE_TEST_URL,
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const marker = randomUUID();
const email = `core-navigation-${marker}@example.invalid`;
const password = randomUUID();
const workerName = `Colaborador Navegação ${marker.slice(0, 8)}`;
const clientName = `Cliente Navegação ${marker.slice(0, 8)}`;
let organizationId;
let userId;
let browser;
let failure;
const cleanupErrors = [];

const routes = [
  ["", "Visão geral", "/app"],
  ["Rotina", "Escalas", "/app/scheduling"],
  ["Rotina", "Ausências", "/app/absences"],
  ["Rotina", "Presença", "/app/presences"],
  ["Rotina", "Alocações", "/app/assignments"],
  ["Estrutura", "Operações", "/app/operations"],
  ["Estrutura", "Unidades", "/app/units"],
  ["Estrutura", "Cargos", "/app/job-roles"],
  ["Estrutura", "Postos", "/app/positions"],
  ["Pessoas", "Colaboradores", "/app/workers"],
  ["Clientes e contratos", "Clientes", "/app/clients"],
  ["Clientes e contratos", "Contratos", "/app/contracts"],
  ["Administração", "Usuários", "/app/admin/users"],
  ["Administração", "Auditoria", "/app/admin/audit"],
];
const creationRoutes = [
  "/app/assignments/new",
  "/app/clients/new",
  "/app/contracts/new",
  "/app/job-roles/new",
  "/app/operations/new",
  "/app/positions/new",
  "/app/scheduling/new",
  "/app/units/new",
  "/app/workers/new",
];

async function cleanup(label, run) {
  try {
    const result = await run();
    if (result?.error) throw result.error;
  } catch (error) {
    cleanupErrors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function visible(locator, timeout = 30_000) {
  await locator.waitFor({ state: "visible", timeout });
}

try {
  const organization = await admin.from("organizations").insert({
    legal_name: `Core Navigation ${marker} Ltda`,
    trade_name: `Core Navigation ${marker.slice(0, 8)}`,
    status: "active",
  }).select("id").single();
  if (organization.error) throw organization.error;
  organizationId = organization.data.id;

  const createdUser = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      pulsa_surface: "core",
      pulsa_invite_organization_id: organizationId,
    },
  });
  if (createdUser.error) throw createdUser.error;
  userId = createdUser.data.user.id;
  const profile = await admin.from("profiles").insert({ id: userId, display_name: "Core Navigation Test" });
  if (profile.error) throw profile.error;
  const membership = await admin.from("organization_members").insert({
    organization_id: organizationId,
    profile_id: userId,
    role: "DIRECTOR",
    status: "active",
  });
  if (membership.error) throw membership.error;

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("response", (response) => {
    if (response.url().startsWith(baseUrl + "/app") && response.status() >= 500) {
      browserErrors.push(`${response.status()} ${new URL(response.url()).pathname}`);
    }
  });

  await page.goto(baseUrl + "/");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => url.pathname === "/app", { timeout: 30_000 });
  await visible(page.locator("main h1").first());
  await page.evaluate(() => {
    const profile = { clicks: [], longTasks: [] };
    window.__coreNavigationProfile = profile;
    if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          profile.longTasks.push({ start: entry.startTime, duration: entry.duration });
        }
      }).observe({ type: "longtask", buffered: true });
    }
    document.addEventListener("click", (event) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || !["/app/workers", "/app/clients"].includes(new URL(link.href).pathname)) return;
      const click = { path: new URL(link.href).pathname, start: performance.now(), firstFrame: null, secondFrame: null, skeletonAtFirstFrame: false, skeletonOpacityAtFirstFrame: null };
      profile.clicks.push(click);
      requestAnimationFrame(() => {
        click.firstFrame = performance.now();
        const skeleton = document.querySelector('main [role="status"][aria-label^="Carregando"]');
        click.skeletonAtFirstFrame = Boolean(skeleton);
        click.skeletonOpacityAtFirstFrame = skeleton ? getComputedStyle(skeleton).opacity : null;
        requestAnimationFrame(() => { click.secondFrame = performance.now(); });
      });
    }, true);
  });

  const navigation = page.getByRole("navigation", { name: "Navegação principal" }).first();
  for (const [group, label, href] of routes) {
    if (group) {
      const toggle = navigation.getByRole("button", { name: group, exact: true });
      if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
    }
    const started = performance.now();
    await navigation.getByRole("link", { name: label, exact: true }).click();
    await page.waitForFunction((path) =>
      document.querySelector(`nav[aria-label="Navegação principal"] a[href="${path}"]`)
        ?.getAttribute("aria-current") === "page", href, { timeout: 1_500 });
    const activeMs = Math.round(performance.now() - started);
    assert.ok(activeMs < 500, `Delayed sidebar selection on ${href}: ${activeMs} ms`);
    await page.waitForFunction(({ href, label }) =>
      window.location.pathname === href ||
      [...document.querySelectorAll('[role="status"]')].some(
        (element) => element.getAttribute("aria-label") === `Carregando ${label}`,
      ), { href, label }, { timeout: 1_500 });
    const feedbackMs = Math.round(performance.now() - started);
    assert.ok(feedbackMs < 500, `Delayed navigation feedback on ${href}: ${feedbackMs} ms`);
    await page.waitForFunction((path) => window.location.pathname === path, href, { timeout: 30_000 });
    const routeMs = Math.round(performance.now() - started);
    await visible(page.locator("main h1").first());
    console.log(JSON.stringify({ route: href, activeMs, feedbackMs, routeMs, contentMs: Math.round(performance.now() - started) }));
    if (href === "/app/workers" || href === "/app/clients") {
      const profile = await page.evaluate(() => {
        const state = window.__coreNavigationProfile;
        const click = state.clicks.at(-1);
        return {
          firstFrameMs: Math.round(click.firstFrame - click.start),
          secondFrameMs: Math.round(click.secondFrame - click.start),
          skeletonAtFirstFrame: click.skeletonAtFirstFrame,
          skeletonOpacityAtFirstFrame: click.skeletonOpacityAtFirstFrame,
          longTasks: state.longTasks.filter((task) => task.start >= click.start && task.start < click.secondFrame),
        };
      });
      const finalEntryAnimation = await page.locator("main.core-page .core-content > :first-child").first()
        .evaluate((element) => getComputedStyle(element).animationName);
      assert.ok(profile.firstFrameMs < 250, `First frame was delayed on ${href}: ${profile.firstFrameMs} ms`);
      if (profile.skeletonAtFirstFrame) {
        assert.ok(Number(profile.skeletonOpacityAtFirstFrame) >= 0.95, `Skeleton was transparent on ${href}`);
      }
      assert.equal(finalEntryAnimation, "none", `Late content animation on ${href}`);
      console.log(JSON.stringify({ profileRoute: href, ...profile, finalEntryAnimation }));
    }
  }

  for (const href of ["/app", "/app/clients", "/app/admin/audit"]) {
    const started = performance.now();
    await navigation.locator(`a[href="${href}"]`).click();
    await page.waitForFunction((path) => window.location.pathname === path, href, { timeout: 30_000 });
    await visible(page.locator("main h1").first());
    console.log(JSON.stringify({ revisitedRoute: href, contentMs: Math.round(performance.now() - started) }));
  }

  for (const href of creationRoutes) {
    const started = performance.now();
    const response = await page.goto(baseUrl + href);
    assert.equal(response?.status(), 200, `${href} did not load successfully`);
    await visible(page.locator("main h1").first());
    console.log(JSON.stringify({ creationRoute: href, contentMs: Math.round(performance.now() - started) }));
  }

  await page.goto(baseUrl + `/app/admin/users/${userId}`);
  const userDetailHeading = page.locator("main h1").first();
  await visible(userDetailHeading);
  const headingText = (await userDetailHeading.textContent())?.trim();
  assert.ok(
    headingText === "Core Navigation Test" || headingText === email,
    `Unexpected administration user detail heading: ${headingText}`,
  );
  console.log(`administration user detail: passed (${headingText})`);

  await page.goto(baseUrl + "/app/clients");
  await visible(page.getByRole("heading", { name: "Clientes" }));
  await page.getByRole("link", { name: "Novo cliente" }).first().click();
  await visible(page.getByRole("heading", { name: "Novo cliente" }));
  await page.getByLabel("Razão social").fill(`${clientName} Ltda`);
  await page.getByLabel("Nome fantasia").fill(clientName);
  await page.getByLabel("CNPJ").fill("11.222.333/0001-81");
  await page.getByRole("button", { name: "Cadastrar cliente" }).click();
  await page.waitForURL((url) => /^\/app\/clients\/[0-9a-f-]+$/.test(url.pathname), { timeout: 30_000 });
  const clientDetailPath = new URL(page.url()).pathname;
  await visible(page.getByRole("heading", { name: clientName, exact: true }));
  await page.getByRole("link", { name: "Editar", exact: true }).click();
  await visible(page.getByRole("heading", { name: "Editar cliente" }));
  await page.getByLabel("Nome fantasia").fill(`${clientName} Editado`);
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.waitForURL((url) => url.pathname === clientDetailPath, { timeout: 30_000 });
  await visible(page.getByRole("heading", { name: `${clientName} Editado`, exact: true }));
  console.log("client create/detail/edit: passed");

  await page.goto(baseUrl + "/app/workers");
  await visible(page.getByRole("heading", { name: "Colaboradores" }));
  const drawerStarted = performance.now();
  await page.getByRole("link", { name: "Novo colaborador" }).first().click();
  const drawer = page.getByRole("dialog", { name: "Novo colaborador" });
  await visible(drawer);
  console.log(JSON.stringify({ workerDrawerOpenMs: Math.round(performance.now() - drawerStarted) }));
  await drawer.getByLabel("Nome completo").fill(workerName);
  await drawer.getByLabel("CPF").fill("529.982.247-25");
  await drawer.getByRole("button", { name: "Cadastrar colaborador" }).click();
  await visible(page.getByRole("link", { name: workerName, exact: true }).first());
  await page.getByRole("link", { name: workerName, exact: true }).first().click();
  await page.waitForURL((url) => /^\/app\/workers\/[0-9a-f-]+$/.test(url.pathname), { timeout: 30_000 });
  const workerDetailPath = new URL(page.url()).pathname;
  await visible(page.getByRole("heading", { name: workerName, exact: true }));
  await page.getByRole("link", { name: "Editar", exact: true }).click();
  await visible(page.getByRole("heading", { name: "Editar colaborador" }));
  await page.getByLabel("Nome completo").fill(`${workerName} Editado`);
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.waitForURL((url) => url.pathname === workerDetailPath, { timeout: 30_000 });
  await visible(page.getByRole("heading", { name: `${workerName} Editado`, exact: true }));
  console.log("worker drawer/create/detail/edit: passed");

  assert.deepEqual(browserErrors, []);
} catch (error) {
  failure = error;
} finally {
  if (organizationId) {
    await cleanup("audit_events", () => admin.from("audit_events").delete().eq("organization_id", organizationId));
    await cleanup("workers", () => admin.from("workers").delete().eq("organization_id", organizationId));
    await cleanup("clients", () => admin.from("clients").delete().eq("organization_id", organizationId));
  }
  if (userId) {
    await cleanup("organization_members", () => admin.from("organization_members").delete().eq("profile_id", userId));
    await cleanup("profiles", () => admin.from("profiles").delete().eq("id", userId));
    await cleanup("auth user", () => admin.auth.admin.deleteUser(userId));
  }
  if (organizationId) {
    await cleanup("organizations", () => admin.from("organizations").delete().eq("id", organizationId));
  }
  if (browser) {
    try {
      const closeResult = await Promise.race([
        browser.close().then(() => "closed"),
        new Promise((resolve) => setTimeout(() => resolve("timeout"), 5_000)),
      ]);
      if (closeResult === "timeout") console.warn("Browser shutdown exceeded 5 seconds.");
    } catch (error) {
      console.warn("Browser shutdown failed:", error instanceof Error ? error.message : String(error));
    }
  }
}

if (failure) console.error(failure);
if (cleanupErrors.length) console.error("Fixture cleanup failed:", cleanupErrors);
const exitCode = failure || cleanupErrors.length ? 1 : 0;
console.log(exitCode === 0 ? "Core navigation validation passed." : "Core navigation validation failed.");
process.exit(exitCode);
