import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-12 w-full rounded-[var(--radius-control)] border border-input bg-panel px-3.5 text-base text-panel-foreground transition placeholder:text-muted-foreground focus:border-primary", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-28 w-full rounded-[var(--radius-control)] border border-input bg-panel px-3.5 py-3 text-base text-panel-foreground transition placeholder:text-muted-foreground focus:border-primary", className)} {...props} />;
}
