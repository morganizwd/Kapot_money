import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/85",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/85",
  outline: "border border-border bg-panel hover:bg-muted active:bg-muted/75",
  ghost: "hover:bg-muted active:bg-muted/75",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90 active:bg-danger/85",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-14 px-5 text-base",
  icon: "size-11 p-0",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(function Button({ className, variant = "primary", size = "md", type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55",
        variants[variant], sizes[size], className,
      )}
      {...props}
    />
  );
});
