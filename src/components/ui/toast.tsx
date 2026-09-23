"use client";

import { CheckCircle2, X } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

import { Button } from "./button";

export function Toast({
  className,
  description,
  duration = 5000,
  onOpenChange,
  open,
  title,
}: {
  className?: string;
  description?: React.ReactNode;
  duration?: number;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open || duration <= 0) return;
    const timeout = window.setTimeout(() => onOpenChange(false), duration);
    return () => window.clearTimeout(timeout);
  }, [duration, onOpenChange, open]);

  if (!open) return null;

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] flex justify-center sm:inset-x-auto sm:right-5 sm:bottom-5"
      role="status"
    >
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-surface border border-status-success-border bg-surface p-4 text-foreground shadow-lg",
          className,
        )}
      >
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-status-success-foreground"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <Button
          aria-label="Fechar notificação"
          className="-mt-2 -mr-2 size-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(false)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
