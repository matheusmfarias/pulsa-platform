import Image from "next/image";

import { cn } from "@/shared/utils";

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-7 items-center",
        compact ? "justify-center" : "justify-start",
        className,
      )}
    >
      <Image
        src={
          compact
            ? "/brand/pulsa-symbol.png"
            : "/brand/pulsa-logo-horizontal.png"
        }
        alt="Pulsa"
        width={compact ? 36 : 108}
        height={36}
        className={cn(
          "object-contain",
          compact ? "size-7" : "h-7 w-auto",
        )}
        priority
      />
    </div>
  );
}