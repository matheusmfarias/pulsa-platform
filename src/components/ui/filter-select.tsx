"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

export type FilterSelectOption<Value extends string> = {
  label: string;
  value: Value;
};

export function FilterSelect<Value extends string>({
  ariaLabel,
  label,
  onValueChange,
  options,
  value,
}: {
  ariaLabel: string;
  label: string;
  onValueChange: (value: Value) => void;
  options: FilterSelectOption<Value>[];
  value: Value;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId();
  const selectedOption = options.find((option) => option.value === value);

  React.useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    optionRefs.current[options.findIndex((option) => option.value === value)]?.focus();
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open, options, value]);

  function moveFocus(direction: 1 | -1) {
    const currentIndex = optionRefs.current.findIndex(
      (option) => option === document.activeElement,
    );
    const nextIndex =
      (currentIndex + direction + options.length) % options.length;
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      className="relative shrink-0"
      onKeyDown={(event) => {
        if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
          event.preventDefault();
          setOpen(true);
          return;
        }

        if (!open) return;
        if (event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          moveFocus(1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          moveFocus(-1);
        }
      }}
      ref={containerRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className="inline-flex h-10 max-w-64 items-center justify-between gap-2 rounded-control border border-input bg-background px-3 text-sm font-medium text-foreground shadow-[0_1px_0_rgb(0_0_0/0.025)] transition-[background-color,border-color,color] hover:border-border-strong hover:bg-hover/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <span>{label}</span>
          {value !== options[0]?.value ? (
            <>
              <span aria-hidden="true" className="text-muted-foreground/70">·</span>
              <span className="truncate font-semibold">
                {selectedOption?.label ?? ""}
              </span>
            </>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          aria-label={ariaLabel}
          className="absolute right-0 z-30 mt-1.5 min-w-56 rounded-surface border border-border-default bg-surface p-1.5 shadow-sm"
          id={menuId}
          role="menu"
        >
          {options.map((option, index) => {
            const selected = option.value === value;

            return (
              <button
                aria-checked={selected}
                className={cn(
                  "grid min-h-9 w-full grid-cols-[minmax(0,1fr)_1rem] items-center gap-3 rounded-control px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-hover/55 focus-visible:bg-hover/65 focus-visible:outline-none",
                  selected && "bg-subtle/70 font-medium",
                )}
                key={option.value}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="menuitemradio"
                tabIndex={selected ? 0 : -1}
                type="button"
              >
                <span className="truncate">{option.label}</span>
                <span
                  aria-hidden="true"
                  className="flex size-4 items-center justify-center"
                >
                  {selected ? <Check className="size-3.5 text-primary" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
