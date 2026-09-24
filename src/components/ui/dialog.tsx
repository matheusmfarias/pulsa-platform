"use client";

import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

import { Button } from "./button";

export function Dialog({ children, className, description, onOpenChange, open, title }: {
  children: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: React.ReactNode;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-dialog-content] select, [data-dialog-content] input:not([type=hidden]), [data-dialog-content] textarea, [data-dialog-content] button")?.focus();
    return () => {
      if (dialog.open) dialog.close();
      returnFocusRef.current?.focus();
    };
  }, [open]);

  return <dialog
    aria-describedby={description ? descriptionId : undefined}
    aria-labelledby={titleId}
    className={cn("fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-surface border border-border-default bg-surface p-0 text-foreground shadow-xl outline-none backdrop:bg-foreground/30", className)}
    onCancel={(event) => { event.preventDefault(); onOpenChange(false); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onOpenChange(false);
    }}
    ref={dialogRef}
  >
    <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold" id={titleId}>{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground" id={descriptionId}>{description}</p> : null}
        </div>
        <Button aria-label="Fechar janela" className="-mr-2 -mt-2 shrink-0" onClick={() => onOpenChange(false)} size="icon" type="button" variant="ghost"><X aria-hidden="true" className="size-4" /></Button>
      </header>
      <div className="mt-5" data-dialog-content>{children}</div>
    </div>
  </dialog>;
}
