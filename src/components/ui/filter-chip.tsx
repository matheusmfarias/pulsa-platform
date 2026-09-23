"use client";

import { X } from "lucide-react";

import { cn } from "@/shared/utils";

export function FilterChip({
  children,
  className,
  onRemove,
  removeLabel,
}: {
  children: React.ReactNode;
  className?: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 max-w-full shrink-0 items-center gap-0.5 rounded-control border border-border-default/80 bg-background px-2 text-xs font-medium text-foreground/80",
        className,
      )}
    >
      <span className="min-w-0 max-w-56 truncate">{children}</span>
      <button
        aria-label={removeLabel}
        className="-mr-1 inline-flex size-5 items-center justify-center rounded-control text-muted-foreground/80 transition-colors hover:bg-hover/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        onClick={onRemove}
        type="button"
      >
        <X aria-hidden="true" className="size-3" />
      </button>
    </span>
  );
}
