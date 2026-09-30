"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

type NativeOptionProps = {
  value?: string | number;
  disabled?: boolean;
  children?: React.ReactNode;
};

type SelectProps = {
  "aria-describedby"?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string;
  children?: React.ReactNode;
  className?: string;
  defaultValue?: string | number;
  disabled?: boolean;
  form?: string;
  id?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  value?: string | number;
  menuClassName?: string;
};

function readOptions(children: React.ReactNode): NativeOptionProps[] {
  const options: NativeOptionProps[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<NativeOptionProps>(child)) return;

    if (child.type === React.Fragment) {
      options.push(...readOptions(child.props.children));
      return;
    }

    if (child.type === "option") {
      options.push(child.props);
    }
  });

  return options;
}

export function Select({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  children,
  className,
  defaultValue,
  disabled = false,
  form,
  id,
  name,
  onValueChange,
  required = false,
  value,
  menuClassName,
}: SelectProps) {
  const options = React.useMemo(() => readOptions(children), [children]);
  const firstValue = String(options[0]?.value ?? options[0]?.children ?? "");
  const initialValue = String(defaultValue ?? firstValue);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(initialValue);
  const selectedValue = String(isControlled ? value : uncontrolledValue);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const hiddenInputRef = React.useRef<HTMLInputElement>(null);
  const optionRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const typeaheadRef = React.useRef("");
  const typeaheadTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = React.useId();
  const enabledIndexes = options.flatMap((option, index) => option.disabled ? [] : [index]);
  const selectedIndex = options.findIndex((option) => String(option.value ?? option.children ?? "") === selectedValue);
  const selectedOption = options[selectedIndex];
  const activeOptionId = open && options[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined;

  React.useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [activeIndex, open]);

  React.useEffect(() => {
    const input = hiddenInputRef.current;
    const ownerForm = input?.form;
    if (!ownerForm || isControlled) return;

    function resetValue() {
      setUncontrolledValue(initialValue);
      setOpen(false);
    }

    ownerForm.addEventListener("reset", resetValue);
    return () => ownerForm.removeEventListener("reset", resetValue);
  }, [form, initialValue, isControlled]);

  React.useEffect(() => () => {
    if (typeaheadTimeoutRef.current) clearTimeout(typeaheadTimeoutRef.current);
  }, []);

  function openMenu() {
    const selectedIsEnabled = selectedIndex >= 0 && !options[selectedIndex]?.disabled;
    setActiveIndex(selectedIsEnabled ? selectedIndex : (enabledIndexes[0] ?? 0));
    setOpen(true);
  }

  function moveActive(direction: 1 | -1) {
    if (!enabledIndexes.length) return;
    const current = enabledIndexes.indexOf(activeIndex);
    const next = current < 0
      ? direction === 1 ? enabledIndexes[0] : enabledIndexes.at(-1)!
      : enabledIndexes[(current + direction + enabledIndexes.length) % enabledIndexes.length];
    setActiveIndex(next);
  }

  function chooseOption(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    const nextValue = String(option.value ?? option.children ?? "");
    if (nextValue !== selectedValue) {
      containerRef.current?.dispatchEvent(new CustomEvent("pulsa:field-change", { bubbles: true }));
    }
    if (!isControlled) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? enabledIndexes[0] ?? 0 : enabledIndexes.at(-1) ?? 0);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseOption(activeIndex);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeaheadRef.current += event.key.toLocaleLowerCase("pt-BR");
      if (typeaheadTimeoutRef.current) clearTimeout(typeaheadTimeoutRef.current);
      typeaheadTimeoutRef.current = setTimeout(() => { typeaheadRef.current = ""; }, 500);
      const startIndex = enabledIndexes.indexOf(activeIndex);
      const searchOrder = [...enabledIndexes.slice(startIndex + 1), ...enabledIndexes.slice(0, startIndex + 1)];
      const match = searchOrder.find((index) => (optionRefs.current[index]?.textContent ?? "").trim().toLocaleLowerCase("pt-BR").startsWith(typeaheadRef.current));
      if (match !== undefined) setActiveIndex(match);
    }
  }

  return (
    <div className="relative min-w-0" ref={containerRef}>
      {name ? <input disabled={disabled} form={form} name={name} ref={hiddenInputRef} type="hidden" value={selectedValue} /> : null}
      {required && !disabled ? (
        <input
          aria-hidden="true"
          className="pointer-events-none absolute size-px opacity-0"
          form={form}
          onChange={() => undefined}
          onInvalid={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
          required
          tabIndex={-1}
          type="text"
          value={selectedValue}
        />
      ) : null}
      <button
        aria-activedescendant={activeOptionId}
        aria-controls={listboxId}
        aria-describedby={ariaDescribedBy}
        aria-disabled={disabled || undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-control border border-input bg-surface px-3 py-2 text-left text-sm text-foreground outline-none transition-[background-color,border-color,box-shadow] hover:border-border-strong focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 aria-invalid:border-status-danger-border aria-invalid:ring-2 aria-invalid:ring-status-danger-foreground/15 disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-70",
          className,
        )}
        disabled={disabled}
        id={id}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span className={cn("min-w-0 truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption?.children ?? "Selecione uma opção"}
        </span>
        <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          className={cn("absolute left-0 z-40 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-surface border border-border-default bg-surface p-1.5 shadow-lg", menuClassName)}
          id={listboxId}
          role="listbox"
        >
          {options.map((option, index) => {
            const optionValue = String(option.value ?? option.children ?? "");
            const selected = optionValue === selectedValue;
            const active = index === activeIndex;

            return (
              <div
                aria-disabled={option.disabled || undefined}
                aria-selected={selected}
                className={cn(
                  "grid min-h-9 grid-cols-[minmax(0,1fr)_1rem] items-center gap-3 rounded-control px-2.5 py-2 text-sm text-foreground transition-colors",
                  option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-hover/55",
                  active && !option.disabled && "bg-hover/65",
                  selected && "font-medium",
                )}
                id={`${listboxId}-option-${index}`}
                key={`${optionValue}-${index}`}
                onClick={() => chooseOption(index)}
                onMouseEnter={() => { if (!option.disabled) setActiveIndex(index); }}
                ref={(element) => { optionRefs.current[index] = element; }}
                role="option"
              >
                <span className="min-w-0 truncate">{option.children}</span>
                <span aria-hidden="true" className="flex size-4 items-center justify-center">
                  {selected ? <Check className="size-3.5 text-primary" /> : null}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
