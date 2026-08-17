"use client";

import { useState } from "react";
import { CirclePlus, PencilLine, WalletCards } from "lucide-react";
import { CategoryIcon } from "@/components/app/category-icon";
import { BottomSheet, MoneyAmount, PageContainer, SectionHeader } from "@/components/app/mobile-ui";
import { CategoryForm } from "@/components/forms/category-form";
import { WalletBalanceForm } from "@/components/forms/wallet-balance-form";
import { WalletForm } from "@/components/forms/wallet-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category, FinanceBook, WalletBalance } from "@/lib/types";

const walletTypeLabels: Record<string, string> = { bank_card: "Карта", cash: "Наличные", bank_account: "Счёт", savings: "Накопления", deposit: "Депозит", ewallet: "Эл. кошелёк", credit: "Кредит", other: "Другое" };

export function WalletsContent({ book, wallets, categories }: { book: FinanceBook; wallets: WalletBalance[]; categories: Category[] }) {
  const [sheet, setSheet] = useState<"wallet" | "category" | "balance" | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletBalance | null>(null);
  const [categoryKind, setCategoryKind] = useState<"expense" | "income">("expense");
  const listedCategories = categories.filter((category) => category.kind === categoryKind);

  return (
    <PageContainer className="grid gap-7">
      <header className="flex items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Где находятся деньги</p><h1 className="mt-1 text-[1.75rem] font-bold">Кошельки</h1></div><Button size="icon" onClick={() => setSheet("wallet")} aria-label="Добавить кошелёк"><CirclePlus aria-hidden className="size-6" /></Button></header>

      <section>
        <SectionHeader title="Ваши кошельки" action={<button type="button" onClick={() => setSheet("wallet")} className="text-sm font-semibold text-primary">Добавить</button>} />
        {wallets.length === 0 ? <div className="mt-3 rounded-[var(--radius-card)] bg-muted px-5 py-7 text-center"><WalletCards aria-hidden className="mx-auto size-7 text-primary" /><p className="mt-3 font-semibold">Нет кошельков</p><p className="mt-1 text-sm text-muted-foreground">Создайте первый, чтобы начать учитывать баланс.</p><Button className="mt-5" onClick={() => setSheet("wallet")}>Создать кошелёк</Button></div> : <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{wallets.map((wallet) => <article key={wallet.id} className="rounded-[var(--radius-card)] border border-border bg-panel p-5 shadow-[var(--shadow-panel)]"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground"><WalletCards aria-hidden className="size-5" /></span><Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary" aria-label={`Изменить баланс кошелька ${wallet.name}`} title="Изменить баланс" onClick={() => { setSelectedWallet(wallet); setSheet("balance"); }}><PencilLine aria-hidden className="size-5" /></Button></div><p className="mt-4 truncate text-base font-semibold">{wallet.name}</p><p className="mt-1 text-sm text-muted-foreground">{walletTypeLabels[wallet.type] ?? wallet.type}</p><div className="mt-5"><MoneyAmount amountMinor={wallet.current_balance_minor} currencyCode={wallet.currency_code} className="text-2xl font-bold" /></div>{!wallet.include_in_net_worth ? <p className="mt-3 text-xs font-semibold text-muted-foreground">Не входит в общий баланс</p> : null}</article>)}</div>}
      </section>

      <section>
        <SectionHeader title="Категории" action={<button type="button" onClick={() => setSheet("category")} className="text-sm font-semibold text-primary">Добавить</button>} />
        <div className="mt-3 inline-flex rounded-[var(--radius-control)] bg-muted p-1" role="tablist" aria-label="Тип категорий"><button type="button" role="tab" aria-selected={categoryKind === "expense"} onClick={() => setCategoryKind("expense")} className={cn("min-h-10 rounded-[10px] px-4 text-sm font-semibold transition", categoryKind === "expense" ? "bg-panel shadow-sm" : "text-muted-foreground")}>Расходы</button><button type="button" role="tab" aria-selected={categoryKind === "income"} onClick={() => setCategoryKind("income")} className={cn("min-h-10 rounded-[10px] px-4 text-sm font-semibold transition", categoryKind === "income" ? "bg-panel shadow-sm" : "text-muted-foreground")}>Доходы</button></div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{listedCategories.map((category) => <div key={category.id} className="flex min-h-14 items-center gap-3 rounded-[var(--radius-control)] bg-muted px-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-panel text-primary"><CategoryIcon name={category.name} icon={category.icon} className="size-4" /></span><span className="min-w-0 truncate text-sm font-semibold">{category.parent_id ? `${category.name}` : category.name}</span></div>)}{listedCategories.length === 0 ? <p className="col-span-full rounded-[var(--radius-control)] bg-muted p-4 text-sm text-muted-foreground">Категорий этого типа пока нет.</p> : null}</div>
      </section>

      {sheet === "wallet" ? <BottomSheet title="Новый кошелёк" onClose={() => setSheet(null)}><WalletForm book={book} /></BottomSheet> : null}
      {sheet === "category" ? <BottomSheet title="Новая категория" onClose={() => setSheet(null)}><CategoryForm book={book} categories={categories} /></BottomSheet> : null}
      {sheet === "balance" && selectedWallet ? <BottomSheet title={selectedWallet.name} onClose={() => { setSheet(null); setSelectedWallet(null); }}><WalletBalanceForm wallet={selectedWallet} onSuccess={() => { setSheet(null); setSelectedWallet(null); }} /></BottomSheet> : null}
    </PageContainer>
  );
}
