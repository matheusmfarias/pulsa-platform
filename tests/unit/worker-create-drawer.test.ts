import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const framework = vi.hoisted(() => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));
const services = vi.hoisted(() => ({
  createWorker: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: framework.revalidatePath,
}));
vi.mock("next/navigation", () => ({
  redirect: framework.redirect,
  RedirectType: { replace: "replace" },
}));
vi.mock("@/modules/workers/services/create-worker", () => ({
  createWorker: services.createWorker,
}));
vi.mock("@/modules/workers/services/update-worker", () => ({
  updateWorker: vi.fn(),
}));
vi.mock("@/modules/workers/services/change-worker-status", () => ({
  changeWorkerStatus: vi.fn(),
}));

import { createWorkerInDrawerAction } from "@/modules/workers/actions";
import {
  parseWorkerListSearchParams,
  workerListHref,
} from "@/modules/workers/components/worker-list-filters";
import {
  formatBrazilianPhoneInput,
  formatCpfInput,
} from "@/modules/workers/components/worker-input-masks";

const validWorker = {
  full_name: "Pessoa Fictícia",
  document_number: "529.982.247-25",
  email: "",
  phone: "",
  engagement_start_date: "",
  engagement_end_date: "",
};

function workerFormData(overrides: Partial<typeof validWorker> = {}) {
  const formData = new FormData();
  const values = { ...validWorker, ...overrides };
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("worker create drawer flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    framework.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("preserves normalized filters when opening and closing the drawer", () => {
    const filters = parseWorkerListSearchParams({
      q: " Maria ",
      status: "active",
    });

    expect(workerListHref("/app/workers/new", filters)).toBe(
      "/app/workers/new?q=Maria&status=active",
    );
    expect(workerListHref("/app/workers", filters)).toBe(
      "/app/workers?q=Maria&status=active",
    );
  });

  it("renders the same workspace on direct /new access and closes client-side", () => {
    const newPage = readFileSync(
      resolve("src/app/(authenticated)/app/workers/new/page.tsx"),
      "utf8",
    );
    const drawer = readFileSync(
      resolve("src/modules/workers/components/new-worker-drawer.tsx"),
      "utf8",
    );

    expect(newPage).toContain("<WorkersWorkspace filters={filters} />");
    expect(newPage).toContain("<NewWorkerDrawer returnHref={returnHref} />");
    expect(drawer).toContain("router.replace(returnHref, { scroll: false })");
  });

  it("keeps the list mounted for soft navigation and uses history to close", () => {
    const layout = readFileSync(
      resolve("src/app/(authenticated)/app/workers/layout.tsx"),
      "utf8",
    );
    const interceptedPage = readFileSync(
      resolve(
        "src/app/(authenticated)/app/workers/@drawer/(.)new/page.tsx",
      ),
      "utf8",
    );
    const drawer = readFileSync(
      resolve("src/modules/workers/components/new-worker-drawer.tsx"),
      "utf8",
    );

    expect(layout).toContain("{children}");
    expect(layout).toContain("{drawer}");
    expect(interceptedPage).toContain('closeMode="back"');
    expect(drawer).toContain("router.back()");
  });

  it("uses an accessible modal drawer with focus, scroll and mobile safeguards", () => {
    const primitive = readFileSync(resolve("src/components/ui/drawer.tsx"), "utf8");
    const form = readFileSync(
      resolve("src/modules/workers/components/worker-form.tsx"),
      "utf8",
    );

    expect(primitive).toContain("dialog.showModal()");
    expect(primitive).toContain("onCancel=");
    expect(primitive).toContain('document.body.style.overflow = "hidden"');
    expect(primitive).toContain("returnFocusRef.current?.focus()");
    expect(primitive).toContain('orientation="vertical"');
    expect(primitive).toContain("h-dvh");
    expect(form).toContain("<DrawerFooter>");
    expect(form).toContain("firstInvalidField?.focus()");
  });

  it("keeps the form usable at 390px and 360px viewport widths", () => {
    const primitive = readFileSync(resolve("src/components/ui/drawer.tsx"), "utf8");
    const form = readFileSync(
      resolve("src/modules/workers/components/worker-form.tsx"),
      "utf8",
    );

    expect(primitive).toContain("h-dvh");
    expect(primitive).toContain("w-full");
    expect(primitive).toContain("sm:w-[32rem]");
    expect(primitive).toContain("overflow-y-auto overscroll-contain");
    expect(primitive).toContain("env(safe-area-inset-top)");
    expect(primitive).toContain("env(safe-area-inset-bottom)");
    expect(form).toContain('className="flex min-h-0 flex-1 flex-col"');
    expect(form.indexOf("<DrawerBody>")).toBeLessThan(
      form.indexOf("<DrawerFooter>"),
    );
    expect(form).toContain('twoColumns={false}');
  });

  it("protects dirty forms before closing from every drawer close action", () => {
    const drawer = readFileSync(
      resolve("src/modules/workers/components/new-worker-drawer.tsx"),
      "utf8",
    );
    const form = readFileSync(
      resolve("src/modules/workers/components/worker-form.tsx"),
      "utf8",
    );

    expect(drawer).toContain("if (dirty) setDiscardConfirmationOpen(true)");
    expect(drawer).toContain("Descartar alterações?");
    expect(drawer).toContain("Continuar editando");
    expect(drawer).toContain("As informações preenchidas ainda não foram salvas.");
    expect(form).toContain("onDirtyChange?.(readSnapshot() !== initialSnapshotRef.current)");
  });

  it("applies progressive CPF and safe Brazilian phone presentation masks", () => {
    expect(formatCpfInput("52998224725")).toBe("529.982.247-25");
    expect(formatCpfInput("52998")).toBe("529.98");
    expect(formatBrazilianPhoneInput("11987654321")).toBe("(11) 98765-4321");
    expect(formatBrazilianPhoneInput("+55 11 98765-4321")).toBe(
      "+55 11 98765-4321",
    );
  });

  it("revalidates the list and closes to the filtered workspace after success", async () => {
    services.createWorker.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000601",
    });

    await expect(
      createWorkerInDrawerAction(
        "/app/workers?q=Maria&status=active",
        { error: null },
        workerFormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(services.createWorker).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Pessoa Fictícia",
        document_number: "52998224725",
      }),
    );
    expect(framework.revalidatePath).toHaveBeenCalledWith("/app/workers");
    expect(framework.redirect).toHaveBeenCalledWith(
      "/app/workers?q=Maria&status=active&feedback=worker-created",
      "replace",
    );
  });

  it("announces success with a dismissible toast and removes ephemeral URL state", () => {
    const toast = readFileSync(resolve("src/components/ui/toast.tsx"), "utf8");
    const successToast = readFileSync(
      resolve("src/modules/workers/components/worker-create-success-toast.tsx"),
      "utf8",
    );

    expect(toast).toContain('aria-live="polite"');
    expect(toast).toContain("window.setTimeout");
    expect(toast).toContain('aria-label="Fechar notificação"');
    expect(successToast).toContain("Colaborador cadastrado");
    expect(successToast).toContain("window.history.replaceState");
  });

  it("keeps the drawer open and returns field errors for invalid input", async () => {
    const result = await createWorkerInDrawerAction(
      "/app/workers?status=active",
      { error: null },
      workerFormData({ document_number: "123" }),
    );

    expect(result.error).toBe("Revise os campos informados.");
    expect(result.fieldErrors?.document_number).toContain("Informe um CPF válido.");
    expect(services.createWorker).not.toHaveBeenCalled();
    expect(framework.redirect).not.toHaveBeenCalled();
  });
});
