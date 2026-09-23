import * as React from "react";

import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { cn } from "@/shared/utils";

export function TableFrame({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-surface border border-border-default bg-surface",
        className,
      )}
      {...props}
    />
  );
}

export interface TableScrollAreaProps extends React.ComponentProps<"div"> {
  label: string;
  shadow?: boolean;
}

export function TableScrollArea({
  className,
  label,
  shadow = false,
  children,
  ...props
}: TableScrollAreaProps) {
  const scrollAreaClassName = cn(
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
    className,
  );

  if (shadow) {
    return (
      <ScrollShadow
        aria-label={label}
        role="region"
        scrollAreaClassName={scrollAreaClassName}
        tabIndex={0}
        {...props}
      >
        {children}
      </ScrollShadow>
    );
  }

  return (
    <div
      aria-label={label}
      className={cn(
        "overflow-x-auto",
        scrollAreaClassName,
      )}
      role="region"
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <table className={cn("w-full text-left text-sm", className)} {...props} />;
}

export function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "border-b border-border-default bg-subtle/60 text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("divide-y divide-border-default/80", className)}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-hover/60 focus-within:bg-hover/60",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-10 whitespace-nowrap px-4 text-left align-middle font-semibold",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}
