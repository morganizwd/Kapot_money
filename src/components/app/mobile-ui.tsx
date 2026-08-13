"use client";

import { type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { Check, ChevronRight, CircleAlert, GripHorizontal, X } from "lucide-react";
import { getCurrencyFractionDigits } from "@/lib/finance/currencies";
import { minorToMajor } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto min-w-0 w-full max-w-[1320px] overflow-x-hidden px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8", className)} {...props} />;
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export function MoneyAmount({
  amountMinor,
  currencyCode,
  sign = "none",
  className,
}: {
  amountMinor: number | bigint;
  currencyCode: string;
  sign?: "none" | "positive" | "negative" | "auto";
  className?: string;
}) {
  const value = BigInt(amountMinor);
  const digits = getCurrencyFractionDigits(currencyCode);
  const absolute = value < 0n ? -value : value;
  const major = Number(minorToMajor(absolute, currencyCode));
  const number = new Intl.NumberFormat("ru-BY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(major);
  const prefix = sign === "positive" || (sign === "auto" && value > 0n) ? "+" : sign === "negative" || (sign === "auto" && value < 0n) ? "−" : "";

  return (
    <span className={cn("inline-flex items-baseline gap-1 whitespace-nowrap tabular-nums", className)}>
      <span>{prefix}{number}</span>
      <span className="text-[0.58em] font-semibold text-muted-foreground">{currencyCode}</span>
    </span>
  );
}

export function MobileFormRow({
  label,
  value,
  icon,
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      {icon ? <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-primary">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate pt-0.5 text-base font-semibold">{value}</span>
      </span>
      {onClick ? <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" /> : null}
    </>
  );

  if (onClick) {
    return <button type="button" onClick={onClick} className={cn("flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-control)] border border-border bg-panel px-3 text-left transition hover:bg-muted active:scale-[0.99]", className)}>{content}</button>;
  }

  return <div className={cn("flex min-h-14 items-center gap-3 rounded-[var(--radius-control)] border border-border bg-panel px-3", className)}>{content}</div>;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 px-5 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-muted text-primary">{icon ?? <CircleAlert aria-hidden className="size-6" />}</span>
      <div className="max-w-xs">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function BottomSheet({
  title,
  children,
  footer,
  onClose,
  labelledBy,
  className,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  labelledBy?: string;
  className?: string;
}) {
  const startY = useRef<number | null>(null);
  const titleId = labelledBy ?? `sheet-title-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="presentation">
      <button type="button" className="fade-in absolute inset-0 cursor-default bg-black/35" aria-label="Закрыть" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("sheet-enter relative z-10 flex max-h-[min(94dvh,780px)] w-full flex-col rounded-t-[var(--radius-sheet)] border-t border-border bg-panel shadow-[var(--shadow-sheet)]", className)}
      >
        <button
          type="button"
          aria-label="Потяните вниз, чтобы закрыть"
          className="flex h-7 w-full shrink-0 touch-none items-end justify-center"
          onPointerDown={(event) => { startY.current = event.clientY; }}
          onPointerUp={(event) => {
            if (startY.current !== null && event.clientY - startY.current > 90) onClose();
            startY.current = null;
          }}
        >
          <GripHorizontal aria-hidden className="size-7 text-muted-foreground/70" />
        </button>
        <header className="flex min-h-14 items-center justify-between gap-3 px-5 pb-2">
          <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95">
            <X aria-hidden className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer ? <footer className="shrink-0 border-t border-border bg-panel px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">{footer}</footer> : null}
      </section>
    </div>
  );
}

export function SelectionRow({
  title,
  subtitle,
  selected,
  onClick,
  icon,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-3 border-b border-border text-left last:border-0">
      {icon ? <span className="grid size-10 place-items-center rounded-xl bg-muted text-primary">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        {subtitle ? <span className="mt-0.5 block truncate text-sm text-muted-foreground">{subtitle}</span> : null}
      </span>
      {selected ? <Check aria-label="Выбрано" className="size-5 text-primary" /> : null}
    </button>
  );
}
