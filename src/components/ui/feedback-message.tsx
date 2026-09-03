import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils";

const feedbackMessageVariants = cva(
  "rounded-control border px-3 py-2 text-sm leading-5",
  {
    variants: {
      variant: {
        success: "border-status-success-border bg-status-success-background text-status-success-foreground",
        warning: "border-status-warning-border bg-status-warning-background text-status-warning-foreground",
        danger: "border-status-danger-border bg-status-danger-background text-status-danger-foreground",
        info: "border-status-info-border bg-status-info-background text-status-info-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

export interface FeedbackMessageProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof feedbackMessageVariants> {}

export function FeedbackMessage({
  className,
  variant = "info",
  role,
  ...props
}: FeedbackMessageProps) {
  return (
    <div
      className={cn(feedbackMessageVariants({ variant }), className)}
      role={role ?? (variant === "danger" ? "alert" : "status")}
      {...props}
    />
  );
}
