import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-12 w-full rounded-[var(--radius-control)] border border-input bg-panel px-3.5 text-base text-panel-foreground transition focus:border-primary", className)} {...props} />;
}
