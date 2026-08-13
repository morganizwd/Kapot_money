"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, CirclePlus, LayoutDashboard, ListOrdered, MoreHorizontal, Target, WalletCards } from "lucide-react";
import { QuickTransactionSheet } from "@/components/app/quick-transaction-sheet";
import { cn } from "@/lib/utils";
import type { Category, FinanceBook, WalletBalance } from "@/lib/types";

const items = [
  { href: "/app", label: "Главная", icon: LayoutDashboard, exact: true },
  { href: "/app/transactions", label: "История", icon: ListOrdered },
  { href: "/app/reports", label: "Отчёты", icon: BarChart3 },
  { href: "/app/wallets", label: "Кошельки", icon: WalletCards },
  { href: "/app/budgets", label: "Бюджеты", icon: Target },
];

export function AppNavigation({ variant, book, wallets, categories }: { variant: "desktop" | "mobile"; book: FinanceBook | null; wallets: WalletBalance[]; categories: Category[] }) {
  const pathname = usePathname();
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  if (variant === "desktop") {
    return <>
      <button type="button" onClick={() => setQuickAddOpen(true)} disabled={!book} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"><CirclePlus aria-hidden className="size-5" />Новая операция</button>
      <nav aria-label="Основная навигация" className="mt-4 grid gap-1">{items.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={cn("flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-semibold transition", isActive(item.href, item.exact) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon aria-hidden className="size-5" />{item.label}</Link>; })}</nav>
      {isQuickAddOpen && book ? <QuickTransactionSheet book={book} wallets={wallets} categories={categories} onClose={() => setQuickAddOpen(false)} /> : null}
    </>;
  }

  const mobileItems = [items[0], items[1], items[2], { href: "/app/settings", label: "Ещё", icon: MoreHorizontal }];
  return (
    <>
      <nav aria-label="Мобильная навигация" className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(68px+env(safe-area-inset-bottom))] grid-cols-5 border-t border-border bg-panel/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden">
        {mobileItems.slice(0, 2).map((item) => <MobileNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item.href, "exact" in item ? item.exact : undefined)} />)}
        <button type="button" onClick={() => setQuickAddOpen(true)} className="group -mt-6 flex flex-col items-center justify-end gap-1 pb-1 text-xs font-medium text-muted-foreground" aria-label="Добавить операцию"><span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition duration-150 group-active:scale-95"><CirclePlus aria-hidden className="size-7" /></span><span>Добавить</span></button>
        {mobileItems.slice(2).map((item) => <MobileNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} />)}
      </nav>
      {isQuickAddOpen && book ? <QuickTransactionSheet book={book} wallets={wallets} categories={categories} onClose={() => setQuickAddOpen(false)} /> : null}
    </>
  );
}

function MobileNavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean }) {
  return <Link href={href} className={cn("flex min-w-0 flex-col items-center justify-center gap-1 rounded-[10px] text-xs font-medium transition", active ? "text-primary" : "text-muted-foreground")}><Icon aria-hidden className="size-5" /><span className="truncate">{label}</span></Link>;
}
