"use client";

import * as React from "react";

import { cn } from "@/shared/utils";

export interface ScrollShadowProps extends React.ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical";
  scrollAreaClassName?: string;
}

export function ScrollShadow({
  children,
  className,
  orientation = "horizontal",
  onScroll,
  scrollAreaClassName,
  ...props
}: ScrollShadowProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ start: false, end: false });

  const updateEdges = React.useCallback(() => {
    const element = scrollAreaRef.current;

    if (!element) {
      setEdges({ start: false, end: false });
      return;
    }

    if (orientation === "horizontal") {
      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      setEdges({
        start: element.scrollLeft > 1,
        end: maxScrollLeft - element.scrollLeft > 1,
      });
      return;
    }

    const maxScrollTop = element.scrollHeight - element.clientHeight;
    setEdges({
      start: element.scrollTop > 1,
      end: maxScrollTop - element.scrollTop > 1,
    });
  }, [orientation]);

  React.useEffect(() => {
    const element = scrollAreaRef.current;
    if (!element) return;

    updateEdges();
    const resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(element);

    const content = element.firstElementChild;
    if (content) resizeObserver.observe(content);

    return () => resizeObserver.disconnect();
  }, [updateEdges]);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          orientation === "horizontal" ? "overflow-x-auto" : "overflow-y-auto",
          scrollAreaClassName,
        )}
        onScroll={(event) => {
          updateEdges();
          onScroll?.(event);
        }}
        ref={scrollAreaRef}
        {...props}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute z-10 from-surface to-transparent transition-opacity duration-150",
          orientation === "horizontal"
            ? "inset-y-0 left-0 w-5 bg-gradient-to-r"
            : "inset-x-0 top-0 h-5 bg-gradient-to-b",
          edges.start ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute z-10 from-surface to-transparent transition-opacity duration-150",
          orientation === "horizontal"
            ? "inset-y-0 right-0 w-5 bg-gradient-to-l"
            : "inset-x-0 bottom-0 h-5 bg-gradient-to-t",
          edges.end ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
