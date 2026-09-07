import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className, decorative = true }: { className?: string; decorative?: boolean }) {
  return (
    <span className={cn("block", className)}>
      <Image src="/brand/zerodebt-icon.png" width={48} height={48} alt={decorative ? "" : "ZeroDebt"} className="h-full w-full object-contain dark:hidden" priority />
      <Image src="/brand/zerodebt-app-icon.png" width={48} height={48} alt={decorative ? "" : "ZeroDebt"} className="hidden h-full w-full rounded-[22%] object-contain dark:block" priority />
    </span>
  );
}

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("block", className)}>
      <Image src="/brand/zerodebt-logo.png" width={1000} height={700} alt="ZeroDebt" className="h-full w-full object-contain dark:hidden" priority={priority} />
      <Image src="/brand/zerodebt-logo-dark.png" width={2172} height={724} alt="ZeroDebt" className="hidden h-full w-full object-contain dark:block" priority={priority} />
    </span>
  );
}
