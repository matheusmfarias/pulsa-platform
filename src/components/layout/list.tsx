import * as React from "react";

import { cn } from "@/shared/utils";

export function ListFilterBar({
  className,
  method = "get",
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form
      className={cn(
        "mt-6 rounded-surface border border-border-default bg-surface p-3 sm:p-4",
        className,
      )}
      method={method}
      {...props}
    />
  );
}

export function ListFilterActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

export function ActiveFiltersSummary({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "border-t border-border-default pt-3 text-xs leading-5 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function ActiveFilters({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-label="Filtros ativos"
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-border-default pt-3",
        className,
      )}
      {...props}
    />
  );
}

export function ListResultSummary({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "mt-5 flex min-h-6 items-center justify-between gap-4 text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function ListEmptyState({
  title,
  titleId,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  title: React.ReactNode;
  titleId?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "mt-3 border-y border-dashed border-border-strong px-4 py-10 text-center sm:py-12",
        className,
      )}
      {...props}
    >
      <h2 className="font-semibold" id={titleId}>{title}</h2>

      {description ? (
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}

      {action ? (
        <div className="mt-5 flex justify-center">{action}</div>
      ) : null}
    </section>
  );
}
