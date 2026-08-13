import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { AppNavigation } from "@/components/app/app-navigation";
import { BrandLogo } from "@/components/app/brand-logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Category, FinanceBook, WalletBalance } from "@/lib/types";

export function AppShell({ children, books, userEmail, activeBook, quickWallets, quickCategories }: {
  children: ReactNode;
  books: FinanceBook[];
  userEmail: string;
  activeBook: FinanceBook | null;
  quickWallets: WalletBalance[];
  quickCategories: Category[];
}) {
  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[264px] border-r border-border bg-panel px-4 py-5 lg:flex lg:flex-col">
        <Link href="/app" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-muted shadow-sm"><BrandLogo className="size-9" priority /></span>
          <span><span className="block font-semibold">Kapot Money</span><span className="block text-xs text-muted-foreground">Личные финансы</span></span>
        </Link>
        <div className="mt-8 rounded-[var(--radius-control)] bg-muted p-3">
          <p className="px-1 text-xs font-semibold uppercase text-muted-foreground">Профиль</p>
          <div className="mt-2 grid gap-1">
            {books.map((book) => <Link key={book.id} href={`/app?book=${book.id}`} className="flex min-h-11 items-center rounded-[10px] px-3 text-sm font-semibold transition hover:bg-panel">{book.name}</Link>)}
          </div>
        </div>
        <AppNavigation variant="desktop" book={activeBook} wallets={quickWallets} categories={quickCategories} />
        <div className="mt-auto border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between gap-2 px-2"><p className="min-w-0 truncate text-xs text-muted-foreground">{userEmail}</p><ThemeToggle /></div>
          <form action={signOutAction}><Button className="w-full justify-start" variant="ghost" type="submit"><LogOut aria-hidden className="size-4" />Выйти</Button></form>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3">
          <Link href="/app" className="flex min-w-0 items-center gap-2.5"><BrandLogo className="size-9 shrink-0" priority /><span className="min-w-0"><span className="block truncate text-base font-semibold">{activeBook?.name ?? "Личные финансы"}</span><span className="mt-0.5 block text-xs text-muted-foreground">Ваш финансовый обзор</span></span></Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="lg:pl-[264px]"><main>{children}</main></div>
      <AppNavigation variant="mobile" book={activeBook} wallets={quickWallets} categories={quickCategories} />
    </div>
  );
}
