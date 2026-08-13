"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { BottomSheet } from "@/components/app/mobile-ui";
import { TransactionForm } from "@/components/forms/transaction-form";
import type { OperationIntent } from "@/lib/finance/drag-drop";
import type { Category, FinanceBook, TransactionKind, WalletBalance } from "@/lib/types";

const actions: Array<{ kind: TransactionKind; label: string; description: string; icon: typeof ArrowDownLeft; tone: string }> = [
  { kind: "expense", label: "Расход", description: "Деньги ушли из кошелька", icon: ArrowDownLeft, tone: "bg-danger/10 text-danger" },
  { kind: "income", label: "Доход", description: "Деньги поступили в кошелёк", icon: ArrowUpRight, tone: "bg-success/10 text-success" },
  { kind: "transfer", label: "Перевод", description: "Между своими кошельками", icon: ArrowLeftRight, tone: "bg-secondary/10 text-secondary" },
];

export function QuickTransactionSheet({
  book,
  wallets,
  categories,
  onClose,
  intent,
}: {
  book: FinanceBook;
  wallets: WalletBalance[];
  categories: Category[];
  onClose: () => void;
  intent?: OperationIntent;
}) {
  const [kind, setKind] = useState<TransactionKind | null>(intent?.kind ?? null);
  const title = kind === "expense" ? "Расход" : kind === "income" ? "Доход" : kind === "transfer" ? "Перевод" : kind === "adjustment" ? "Корректировка" : "Новая операция";

  return (
    <BottomSheet title={title} onClose={onClose}>
      {kind ? (
        <TransactionForm key={`${kind}-${intent ? JSON.stringify(intent) : "new"}`} book={book} wallets={wallets} categories={categories} initialKind={kind} intent={intent} presentation="sheet" onSuccess={onClose} />
      ) : (
        <div className="grid gap-3 pb-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return <button key={action.kind} type="button" onClick={() => setKind(action.kind)} className="flex min-h-20 items-center gap-4 rounded-[var(--radius-card)] border border-border bg-panel px-4 text-left transition hover:bg-muted active:scale-[0.99]"><span className={`grid size-12 place-items-center rounded-2xl ${action.tone}`}><Icon aria-hidden className="size-6" /></span><span className="min-w-0 flex-1"><span className="block text-base font-semibold">{action.label}</span><span className="mt-1 block text-sm text-muted-foreground">{action.description}</span></span></button>;
          })}
          <button type="button" onClick={() => setKind("adjustment")} className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"><SlidersHorizontal aria-hidden className="size-4" />Корректировка</button>
        </div>
      )}
    </BottomSheet>
  );
}
