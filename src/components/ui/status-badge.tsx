import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-pill border px-2.5 py-1 text-xs font-medium leading-4",
  {
    variants: {
      category: {
        success: "border-status-success-border bg-status-success-background text-status-success-foreground",
        warning: "border-status-warning-border bg-status-warning-background text-status-warning-foreground",
        danger: "border-status-danger-border bg-status-danger-background text-status-danger-foreground",
        info: "border-status-info-border bg-status-info-background text-status-info-foreground",
        neutral: "border-status-neutral-border bg-status-neutral-background text-status-neutral-foreground",
      },
    },
    defaultVariants: {
      category: "neutral",
    },
  },
);

export type StatusCategory = NonNullable<
  VariantProps<typeof statusBadgeVariants>["category"]
>;

export type StatusPresentationMap<Status extends string> = Record<
  Status,
  { label: string; category: StatusCategory }
>;

export interface StatusBadgeProps
  extends Omit<React.ComponentProps<"span">, "children">,
    VariantProps<typeof statusBadgeVariants> {
  label: string;
  status?: string;
}

export function StatusBadge({
  category,
  className,
  label,
  status,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ category }), className)}
      data-status={status}
      {...props}
    >
      {label}
    </span>
  );
}
