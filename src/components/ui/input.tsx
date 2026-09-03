import * as React from "react";

import { cn } from "@/shared/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-control border border-input bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 aria-invalid:border-status-danger-border aria-invalid:ring-2 aria-invalid:ring-status-danger-foreground/15 disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
