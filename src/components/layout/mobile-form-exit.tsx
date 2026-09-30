"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function returnHref() {
  const path = window.location.pathname;
  const query = new URLSearchParams(window.location.search);

  if (path === "/app/assignments/new") {
    const workerId = query.get("workerId");
    const positionId = query.get("positionId");
    if (workerId && /^[\da-f-]{36}$/i.test(workerId)) return `/app/workers/${workerId}`;
    if (positionId && /^[\da-f-]{36}$/i.test(positionId)) return `/app/positions/${positionId}`;
  }

  if (path === "/app/contracts/new") {
    const clientId = query.get("clientId");
    if (clientId && /^[\da-f-]{36}$/i.test(clientId)) return `/app/clients/${clientId}`;
  }

  const nestedPosition = path.match(/^\/app\/units\/([\da-f-]{36})\/positions\/new$/i);
  if (nestedPosition) return `/app/units/${nestedPosition[1]}`;
  if (path.endsWith("/edit") || path.endsWith("/new")) {
    return path.slice(0, path.lastIndexOf("/"));
  }

  return "/app";
}

export function MobileFormExit() {
  const router = useRouter();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [dirty, setDirty] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const close = React.useCallback(() => router.replace(returnHref(), { scroll: false }), [router]);
  const requestClose = React.useCallback(() => {
    if (dirty) setConfirmOpen(true);
    else close();
  }, [close, dirty]);

  React.useEffect(() => {
    const sheet = buttonRef.current?.closest<HTMLElement>(".core-form-container");
    const form = sheet?.querySelector("form");
    const main = sheet?.closest("main");
    if (!sheet || !main) return;

    const media = window.matchMedia("(max-width: 639px)");
    const siblings = Array.from(main.parentElement?.children ?? []).filter((node) => node !== main) as HTMLElement[];
    const previousOverflow = document.body.style.overflow;
    const priorInert = siblings.map((node) => node.inert);
    const markDirty = () => setDirty(true);

    const sync = () => {
      if (media.matches) {
        sheet.setAttribute("role", "dialog");
        sheet.setAttribute("aria-modal", "true");
        sheet.setAttribute("aria-label", sheet.querySelector("h1")?.textContent ?? "Formulário");
        document.body.style.overflow = "hidden";
        siblings.forEach((node) => { node.inert = true; });
      } else {
        sheet.removeAttribute("role");
        sheet.removeAttribute("aria-modal");
        sheet.removeAttribute("aria-label");
        document.body.style.overflow = previousOverflow;
        siblings.forEach((node, index) => { node.inert = priorInert[index]; });
      }
    };

    sync();
    media.addEventListener("change", sync);
    form?.addEventListener("input", markDirty);
    form?.addEventListener("change", markDirty);
    return () => {
      media.removeEventListener("change", sync);
      form?.removeEventListener("input", markDirty);
      form?.removeEventListener("change", markDirty);
      sheet.removeAttribute("role");
      sheet.removeAttribute("aria-modal");
      sheet.removeAttribute("aria-label");
      document.body.style.overflow = previousOverflow;
      siblings.forEach((node, index) => { node.inert = priorInert[index]; });
    };
  }, []);

  return (
    <>
      <div className="core-form-close-slot sm:hidden">
        <Button aria-label="Fechar formulário" onClick={requestClose} ref={buttonRef} size="icon" type="button" variant="outline">
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <AlertDialog
        cancelLabel="Continuar editando"
        confirmLabel="Descartar"
        description="As informações preenchidas ainda não foram salvas."
        onConfirm={() => { setConfirmOpen(false); close(); }}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Descartar alterações?"
      />
    </>
  );
}
