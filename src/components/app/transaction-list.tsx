"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, PencilLine, SlidersHorizontal } from "lucide-react";
import { DeleteTransactionButton } from "@/components/app/delete-transaction-button";
import { CategoryIcon } from "@/components/app/category-icon";
import { BottomSheet, EmptyState, MoneyAmount } from "@/components/app/mobile-ui";
import { TransactionForm } from "@/components/forms/transaction-form";
import type { Category, FinanceBook, TransactionKind, TransactionListItem, WalletBalance } from "@/lib/types";

const kindMeta: Record<TransactionKind, { label: string; icon: typeof ArrowDownLeft; tone: string; background: string }> = {
  income: { label: "Доход", icon: ArrowUpRight, tone: "text-success", background: "bg-success/10" },
  expense: { label: "Расход", icon: ArrowDownLeft, tone: "text-danger", background: "bg-danger/10" },
  transfer: { label: "Перевод", icon: ArrowLeftRight, tone: "text-secondary", background: "bg-secondary/10" },
  adjustment: { label: "Корректировка", icon: SlidersHorizontal, tone: "text-muted-foreground", background: "bg-muted" },
};

export function TransactionList({
  transactions,
  book,
  wallets,
  categories,
  stickyGroupHeaders = true,
}: {
  transactions: TransactionListItem[];
  book: FinanceBook;
  wallets: WalletBalance[];
  categories: Category[];
  stickyGroupHeaders?: boolean;
}) {
  const [selected, setSelected] = useState<TransactionListItem | null>(null);
  const groups = useMemo(() => groupTransactions(transactions), [transactions]);

  if (transactions.length === 0) {
    return <div className="rounded-[var(--radius-card)] border border-border bg-panel"><EmptyState title="Нет операций" description="Добавьте первый расход или доход, и здесь появится история." icon={<PencilLine aria-hidden className="size-6" />} /></div>;
  }

  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-panel shadow-[var(--shadow-panel)]">
        {groups.map((group) => <section key={group.key}><div className={stickyGroupHeaders ? "sticky top-[72px] z-10 border-b border-border bg-panel/95 px-4 py-2.5 text-xs font-semibold text-muted-foreground backdrop-blur lg:top-0" : "border-b border-border bg-panel px-4 py-2.5 text-xs font-semibold text-muted-foreground"}>{group.label}</div>{group.items.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onClick={() => setSelected(transaction)} />)}</section>)}
      </div>
      {selected ? <TransactionEditSheet transaction={selected} book={book} wallets={wallets} categories={categories} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function TransactionRow({ transaction, onClick }: { transaction: TransactionListItem; onClick: () => void }) {
  const meta = kindMeta[transaction.kind];
  const Icon = meta.icon;
  const primaryEntry = getPrimaryEntry(transaction);
  const label = getTransactionLabel(transaction);
  const subtitle = getTransactionSubtitle(transaction);
  const icon = transaction.kind === "expense" || transaction.kind === "income" ? <CategoryIcon name={transaction.categories?.name ?? label} icon={transaction.categories?.icon} /> : <Icon aria-hidden className="size-5" />;

  return (
    <button type="button" onClick={onClick} className="flex min-h-[72px] w-full items-center gap-3 border-b border-border px-4 text-left transition last:border-b-0 hover:bg-muted/65 active:bg-muted">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${meta.background} ${meta.tone}`}>{icon}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{label}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{subtitle}</span></span>
      <span className="shrink-0 text-right"><MoneyAmount amountMinor={primaryEntry ? Math.abs(primaryEntry.amount_minor) : 0} currencyCode={primaryEntry?.currency_code ?? "BYN"} sign={transaction.kind === "income" ? "positive" : transaction.kind === "expense" ? "negative" : "none"} className={transaction.kind === "income" ? "text-sm font-bold text-success" : transaction.kind === "expense" ? "text-sm font-bold text-danger" : "text-sm font-bold"} /><span className="mt-1 block text-xs text-muted-foreground">{formatTransactionTime(transaction.occurred_at)}</span></span>
    </button>
  );
}

function TransactionEditSheet({ transaction, book, wallets, categories, onClose }: { transaction: TransactionListItem; book: FinanceBook; wallets: WalletBalance[]; categories: Category[]; onClose: () => void }) {
  return <BottomSheet title="Операция" onClose={onClose}><TransactionForm book={book} wallets={wallets} categories={categories} initial={toEditableTransaction(transaction)} presentation="sheet" onSuccess={onClose} /><div className="mt-5 border-t border-border pt-4"><DeleteTransactionButton transactionId={transaction.id} /></div></BottomSheet>;
}

function groupTransactions(transactions: TransactionListItem[]) {
  const groups = new Map<string, { key: string; label: string; items: TransactionListItem[] }>();
  for (const transaction of transactions) {
    const date = new Date(transaction.occurred_at);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const existing = groups.get(key) ?? { key, label: formatGroupDate(date), items: [] };
    existing.items.push(transaction);
    groups.set(key, existing);
  }
  return [...groups.values()];
}

function formatGroupDate(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const compared = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (compared === today) return "Сегодня";
  if (compared === today - oneDay) return "Вчера";
  return new Intl.DateTimeFormat("ru-BY", { day: "numeric", month: "long" }).format(date);
}

function formatTransactionTime(value: string) {
  return new Intl.DateTimeFormat("ru-BY", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getPrimaryEntry(transaction: TransactionListItem) {
  const negative = transaction.transaction_entries.find((entry) => entry.amount_minor < 0);
  const positive = transaction.transaction_entries.find((entry) => entry.amount_minor > 0);
  return transaction.kind === "income" ? positive : negative ?? positive;
}

function getTransactionLabel(transaction: TransactionListItem) {
  if (transaction.kind === "transfer") {
    const negative = transaction.transaction_entries.find((entry) => entry.amount_minor < 0);
    const positive = transaction.transaction_entries.find((entry) => entry.amount_minor > 0);
    return `${negative?.wallets?.name ?? "Кошелёк"} → ${positive?.wallets?.name ?? "Кошелёк"}`;
  }
  return transaction.description || transaction.categories?.name || "Операция";
}

function getTransactionSubtitle(transaction: TransactionListItem) {
  if (transaction.kind === "transfer") return "Перемещение между кошельками";
  const wallet = transaction.transaction_entries[0]?.wallets?.name ?? "Кошелёк";
  return `${wallet} · ${kindMeta[transaction.kind].label}`;
}

function toEditableTransaction(transaction: TransactionListItem) {
  const negative = transaction.transaction_entries.find((entry) => entry.amount_minor < 0);
  const positive = transaction.transaction_entries.find((entry) => entry.amount_minor > 0);
  const entry = transaction.kind === "income" ? positive : negative ?? positive;
  const sourceWalletId = transaction.kind === "income" ? null : negative?.wallet_id ?? entry?.wallet_id ?? null;
  const destinationWalletId = transaction.kind === "expense" ? null : positive?.wallet_id ?? entry?.wallet_id ?? null;
  const amountEntry = transaction.kind === "income" ? positive : negative ?? positive;
  const receivedEntry = transaction.kind === "transfer" ? positive : null;
  const toMajor = (amount: number, currency: string) => {
    const digits = new Intl.NumberFormat("ru-BY", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return (Math.abs(amount) / 10 ** digits).toFixed(digits);
  };

  return {
    id: transaction.id,
    kind: transaction.kind,
    categoryId: transaction.category_id,
    description: transaction.description ?? "",
    note: transaction.note ?? "",
    occurredAt: transaction.occurred_at.slice(0, 10),
    sourceWalletId,
    destinationWalletId,
    amount: amountEntry ? toMajor(amountEntry.amount_minor, amountEntry.currency_code) : "",
    receivedAmount: receivedEntry ? toMajor(receivedEntry.amount_minor, receivedEntry.currency_code) : "",
  };
}
