"use client";

import {
  type ReactNode,
  useRef,
  useState,
} from "react";

export function RailTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  function showTooltip() {
    const trigger = triggerRef.current;

    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();

    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });

    setVisible(true);
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setVisible(false)}
        onFocus={showTooltip}
        onBlur={() => setVisible(false)}
      >
        {children}
      </div>

      {visible ? (
        <div
          role="tooltip"
          style={{
            top: position.top,
            left: position.left,
          }}
          className="
            pointer-events-none
            fixed z-[100]
            -translate-y-1/2
            whitespace-nowrap
            rounded-md
            border border-border
            bg-foreground
            px-2.5 py-1.5
            text-xs font-medium
            text-background
            shadow-md
            animate-in fade-in-0 zoom-in-95
            duration-100
          "
        >
          {label}
        </div>
      ) : null}
    </>
  );
}