import * as React from "react";

import { cn } from "@/shared/utils";

export function Card({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-card bg-surface shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return <header className={cn("px-5 py-4 sm:px-6", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
}

export const interactiveCardClassName =
  "transition-[transform,box-shadow,background-color] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-card-hover";
