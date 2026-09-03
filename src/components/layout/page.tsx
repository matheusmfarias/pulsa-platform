import * as React from "react";

import { cn } from "@/shared/utils";

const containerWidths = {
  list: "max-w-7xl",
  detail: "max-w-4xl",
  "detail-wide": "max-w-5xl",
  form: "max-w-3xl",
} as const;

export type ContentContainerSize = keyof typeof containerWidths;

export function PageShell({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("py-10", className)} {...props} />;
}

export interface ContentContainerProps extends React.ComponentProps<"div"> {
  size?: ContentContainerSize;
}

export function ContentContainer({
  size = "list",
  className,
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        containerWidths[size],
        className,
      )}
      {...props}
    />
  );
}

export interface PageHeaderProps
  extends Omit<React.ComponentProps<"header">, "title"> {
  title: React.ReactNode;
  /** Use only when it adds context; it must not repeat the title. */
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  metadata,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="text-sm font-medium text-primary">{eyebrow}</p> : null}
        <h1 className={cn("text-2xl font-semibold tracking-tight", eyebrow && "mt-1")}>
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
        {metadata ? <div className="mt-3 text-sm text-muted-foreground">{metadata}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
