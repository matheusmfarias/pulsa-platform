"use client";

import * as React from "react";

import { cn } from "@/shared/utils";

import { Button } from "./button";

export function AlertDialog({
  cancelLabel,
  className,
  confirmLabel,
  description,
  onConfirm,
  onOpenChange,
  open,
  title,
}: {
  cancelLabel: string;
  className?: string;
  confirmLabel: string;
  description: React.ReactNode;
  onConfirm: () => void;
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
    if (!dialog) return;
    if (open) returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
      if (open) returnFocusRef.current?.focus();
    };
  }, [open]);

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className={cn(
        "fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-surface border border-border-default bg-surface p-0 text-foreground shadow-xl outline-none backdrop:bg-foreground/20",
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      ref={dialogRef}
      role="alertdialog"
    >
      <div className="p-5 sm:p-6">
        <h2 className="text-base font-semibold" id={titleId}>
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground" id={descriptionId}>
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button autoFocus onClick={() => onOpenChange(false)} variant="ghost">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
