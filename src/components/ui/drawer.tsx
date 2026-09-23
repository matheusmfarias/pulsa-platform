"use client";

import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

import { Button, type ButtonProps } from "./button";
import { ScrollShadow } from "./scroll-shadow";

const DrawerContext = React.createContext<{ close: () => void } | null>(null);

export interface DrawerProps
  extends Omit<React.ComponentProps<"dialog">, "open" | "title"> {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  closeLabel?: string;
}

export function Drawer({
  children,
  className,
  closeLabel = "Fechar",
  description,
  onOpenChange,
  open,
  title,
  ...props
}: DrawerProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  const requestClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      returnFocusRef.current?.focus();
    };
  }, [open]);

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className={cn(
        "fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 border-l border-border-default bg-surface p-0 text-foreground shadow-xl outline-none backdrop:bg-foreground/15 sm:w-[32rem] sm:max-w-[calc(100vw-2rem)] sm:rounded-l-surface",
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const outsidePanel =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;
        if (outsidePanel) requestClose();
      }}
      ref={dialogRef}
      role="dialog"
      {...props}
    >
      <DrawerContext.Provider value={{ close: requestClose }}>
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border-default px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-6 sm:py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight" id={titleId}>
                {title}
              </h2>
              {description ? (
                <p
                  className="mt-1 text-sm leading-5 text-muted-foreground"
                  id={descriptionId}
                >
                  {description}
                </p>
              ) : null}
            </div>
            <Button
              aria-label={closeLabel}
              className="-mr-2 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={requestClose}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </header>
          {children}
        </div>
      </DrawerContext.Provider>
    </dialog>
  );
}

export function DrawerClose({ onClick, ...props }: ButtonProps) {
  const context = React.useContext(DrawerContext);
  if (!context) throw new Error("DrawerClose must be used inside Drawer.");

  return (
    <Button
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.close();
      }}
      type="button"
      {...props}
    />
  );
}

export function DrawerBody({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ScrollShadow
      className="min-h-0 flex-1"
      orientation="vertical"
      scrollAreaClassName="h-full overflow-y-auto overscroll-contain"
    >
      <div className={cn("px-5 py-5 sm:px-6", className)} {...props}>
        {children}
      </div>
    </ScrollShadow>
  );
}

export function DrawerFooter({
  className,
  ...props
}: React.ComponentProps<"footer">) {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-border-default bg-surface px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6",
        className,
      )}
      {...props}
    />
  );
}
