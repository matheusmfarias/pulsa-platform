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
  const [discardConfirmationOpen, setDiscardConfirmationOpen] =
    React.useState(false);
  const closeNow = React.useCallback(() => {
    if (closeMode === "back") router.back();
    else router.replace(returnHref, { scroll: false });
  }, [closeMode, returnHref, router]);
  const requestClose = React.useCallback(() => {
    if (dirty) setDiscardConfirmationOpen(true);
    else closeNow();
  }, [closeNow, dirty]);

  return (
    <>
      <Drawer
        closeLabel="Fechar novo colaborador"
        description="Cadastre os dados essenciais da pessoa."
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
          closeNow();
        }}
        onOpenChange={setDiscardConfirmationOpen}
        open={discardConfirmationOpen}
        title="Descartar alterações?"
      />
    </>
  );
}
