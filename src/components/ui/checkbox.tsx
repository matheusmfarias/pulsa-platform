import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

type CheckboxProps = Omit<React.ComponentProps<"input">, "type">;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
      <input
        className={cn(
          "peer size-5 appearance-none rounded-[6px] border border-input bg-surface outline-none transition-[background-color,border-color,box-shadow]",
          "hover:border-border-strong checked:border-action-primary checked:bg-action-primary",
          "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60",
          "aria-invalid:border-status-danger-border aria-invalid:ring-2 aria-invalid:ring-status-danger-foreground/15",
          className,
        )}
        type="checkbox"
        {...props}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-primary-foreground opacity-0 peer-checked:opacity-100"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    </span>
  );
}
