import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/kapot-money-logo-passat-b3.png"
      alt=""
      width={1254}
      height={1254}
      priority={priority}
      sizes="48px"
      className={cn("object-contain", className)}
    />
  );
}
