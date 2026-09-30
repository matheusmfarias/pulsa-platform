"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Drawer } from "@/components/ui/drawer";

import { WorkerForm } from "./worker-form";

export function NewWorkerDrawer({
  closeMode = "replace",
  returnHref,
}: {
  closeMode?: "back" | "replace";
  returnHref: string;
}) {
  const router = useRouter();
  const [dirty, setDirty] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [discardConfirmationOpen, setDiscardConfirmationOpen] =
    React.useState(false);
  const navigationStartedRef = React.useRef(false);
  const finishClose = React.useCallback(() => {
    if (navigationStartedRef.current) return;
    navigationStartedRef.current = true;
    if (closeMode === "back") router.back();
    else router.replace(returnHref, { scroll: false });
  }, [closeMode, returnHref, router]);
  const startClose = React.useCallback(() => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
      return;
    }
    setClosing(true);
  }, [closing, finishClose]);
  const requestClose = React.useCallback(() => {
    if (closing) return;
    if (dirty) setDiscardConfirmationOpen(true);
    else startClose();
  }, [closing, dirty, startClose]);

  React.useEffect(() => {
    if (!closing) return;
    const fallback = window.setTimeout(finishClose, 400);
    return () => window.clearTimeout(fallback);
  }, [closing, finishClose]);

  return (
    <>
      <Drawer
        closeLabel="Fechar novo colaborador"
        data-closing={closing ? "true" : undefined}
        description="Cadastre os dados essenciais da pessoa."
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) finishClose();
        }}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        open
        title="Novo colaborador"
      >
        <WorkerForm
          cancelHref={returnHref}
          createReturnHref={returnHref}
          onDirtyChange={setDirty}
          presentation="drawer"
        />
      </Drawer>
      <AlertDialog
        cancelLabel="Continuar editando"
        confirmLabel="Descartar"
        description="As informações preenchidas ainda não foram salvas."
        onConfirm={() => {
          setDiscardConfirmationOpen(false);
          setDirty(false);
          startClose();
        }}
        onOpenChange={setDiscardConfirmationOpen}
        open={discardConfirmationOpen}
        title="Descartar alterações?"
      />
    </>
  );
}
