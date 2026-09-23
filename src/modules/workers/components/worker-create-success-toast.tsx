"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";

import { Toast } from "@/components/ui/toast";

import { WORKER_CREATED_FEEDBACK } from "./worker-list-filters";

export function WorkerCreateSuccessToast() {
  const searchParams = useSearchParams();
  const feedback = searchParams.get("feedback");
  const [open, setOpen] = React.useState(
    feedback === WORKER_CREATED_FEEDBACK,
  );

  React.useEffect(() => {
    if (feedback !== WORKER_CREATED_FEEDBACK) return;
    const frame = window.requestAnimationFrame(() => {
      setOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("feedback");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [feedback]);

  return (
    <Toast
      description="O colaborador foi adicionado com sucesso."
      onOpenChange={setOpen}
      open={open}
      title="Colaborador cadastrado"
    />
  );
}
