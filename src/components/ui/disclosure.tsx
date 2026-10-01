import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

export function Disclosure({
  className,
  ...props
}: React.ComponentProps<"details">) {
  return <details className={cn("group group/disclosure", className)} {...props} />;
}

export function DisclosureTrigger({
  children,
  className,
  iconClassName,
  ...props
}: React.ComponentProps<"summary"> & { iconClassName?: string }) {
  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-center justify-between gap-3 rounded-control text-sm font-medium text-foreground outline-none transition-colors",
        "hover:text-action-primary focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
        "[&::-webkit-details-marker]:hidden",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none group-open/disclosure:rotate-180",
          iconClassName,
        )}
      />
    </summary>
  );
}

export function DisclosureContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("motion-reduce:transition-none", className)} {...props} />;
}
