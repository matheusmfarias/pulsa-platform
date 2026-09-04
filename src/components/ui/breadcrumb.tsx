import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/utils";

export type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "min-w-0 text-sm",
        className,
      )}
    >
      <ol className="flex min-w-0 items-center gap-1.5">
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <li
              className="flex min-w-0 items-center gap-1.5"
              key={index}
            >
              {index > 0 ? (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground/70"
                />
              ) : null}

              {item.href && !current ? (
                <Link
                  href={item.href}
                  className="
                    min-w-0 truncate
                    text-muted-foreground
                    transition-colors
                    hover:text-foreground
                    focus-visible:rounded-sm
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                  "
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "min-w-0 truncate",
                    current
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}