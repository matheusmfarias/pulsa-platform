import Image from "next/image";

export function BrandMark() {
  return (
    <div className="flex h-7 items-center">
      <Image
        src="/brand/pulsa-logo-horizontal.png"
        alt="Pulsa"
        width={108}
        height={36}
        className="h-7 w-auto object-contain"
        priority
      />
    </div>
  );
}
