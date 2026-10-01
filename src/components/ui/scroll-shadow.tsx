"use client";

import * as React from "react";

import { cn } from "@/shared/utils";

export interface ScrollShadowProps extends React.ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical" | "both";
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
  const [edges, setEdges] = React.useState({ left: false, right: false, top: false, bottom: false });

  const updateEdges = React.useCallback(() => {
    const element = scrollAreaRef.current;

    if (!element) {
      setEdges({ left: false, right: false, top: false, bottom: false });
      return;
    }

    const horizontal = orientation !== "vertical";
    const vertical = orientation !== "horizontal";
    const maxScrollTop = element.scrollHeight - element.clientHeight;
    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    setEdges({
      left: horizontal && element.scrollLeft > 1,
      right: horizontal && maxScrollLeft - element.scrollLeft > 1,
      top: vertical && element.scrollTop > 1,
      bottom: vertical && maxScrollTop - element.scrollTop > 1,
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
          orientation === "horizontal" ? "overflow-x-auto" : orientation === "vertical" ? "overflow-y-auto" : "overflow-auto",
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
      {orientation !== "vertical" ? <>
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-surface to-transparent transition-opacity duration-150", edges.left ? "opacity-100" : "opacity-0")} />
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-surface to-transparent transition-opacity duration-150", edges.right ? "opacity-100" : "opacity-0")} />
      </> : null}
      {orientation !== "horizontal" ? <>
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-surface to-transparent transition-opacity duration-150", edges.top ? "opacity-100" : "opacity-0")} />
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-surface to-transparent transition-opacity duration-150", edges.bottom ? "opacity-100" : "opacity-0")} />
      </> : null}
    </div>
  );
}
