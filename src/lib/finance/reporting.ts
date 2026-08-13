import type { TransactionListItem } from "@/lib/types";

export type DailyReportRow = {
  date: string;
  label: string;
  income_minor: number;
  expense_minor: number;
  cash_flow_minor: number;
};

export function buildDailyReportRows(transactions: TransactionListItem[], from: string, to: string): DailyReportRow[] {
  const fromDate = toUtcDay(from);
  const toDate = toUtcDay(to);
  const rows = new Map<string, DailyReportRow>();

  for (let current = fromDate; current <= toDate; current = addUtcDays(current, 1)) {
    const date = formatUtcDay(current);
    rows.set(date, {
      date,
      label: formatReportDate(date),
      income_minor: 0,
      expense_minor: 0,
      cash_flow_minor: 0,
    });
  }

  for (const transaction of transactions) {
    if (transaction.kind !== "income" && transaction.kind !== "expense") {
      continue;
    }

    const row = rows.get(formatUtcDay(toUtcDay(transaction.occurred_at)));
    if (!row) {
      continue;
    }

    const amountMinor = getTransactionAmountMinor(transaction);
    if (transaction.kind === "income") {
      row.income_minor += amountMinor;
    } else {
      row.expense_minor += amountMinor;
    }
    row.cash_flow_minor = row.income_minor - row.expense_minor;
  }

  return Array.from(rows.values());
}

export function getTransactionAmountMinor(transaction: Pick<TransactionListItem, "transaction_entries">) {
  return transaction.transaction_entries.reduce((total, entry) => total + Math.abs(entry.amount_minor), 0);
}

export function formatReportDate(date: string) {
  return new Intl.DateTimeFormat("ru-BY", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export function formatReportDateLong(date: string) {
  return new Intl.DateTimeFormat("ru-BY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function toUtcDay(value: string) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function formatUtcDay(date: Date) {
  return date.toISOString().slice(0, 10);
}
