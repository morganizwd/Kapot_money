import type {
  BudgetProgress,
  CategoryReportRow,
  PeriodSummary,
  TransactionEntry,
  TransactionListItem,
  Wallet,
} from "@/lib/types";

export function calculateWalletBalance(
  wallet: Pick<Wallet, "opening_balance_minor" | "id">,
  entries: Array<Pick<TransactionEntry, "wallet_id" | "amount_minor">>,
) {
  return entries
    .filter((entry) => entry.wallet_id === wallet.id)
    .reduce((balance, entry) => balance + BigInt(entry.amount_minor), BigInt(wallet.opening_balance_minor));
}

export function calculateBookBalance(
  wallets: Array<Pick<Wallet, "id" | "opening_balance_minor" | "include_in_net_worth">>,
  entries: Array<Pick<TransactionEntry, "wallet_id" | "amount_minor">>,
) {
  return wallets
    .filter((wallet) => wallet.include_in_net_worth)
    .reduce((total, wallet) => total + calculateWalletBalance(wallet, entries), 0n);
}

export function calculateCashFlow(summary: Pick<PeriodSummary, "income_minor" | "expense_minor">) {
  return BigInt(summary.income_minor) - BigInt(summary.expense_minor);
}

export function calculateBudgetUsage(amountMinor: number | bigint, spentMinor: number | bigint): BudgetProgress["progress_percent"] {
  const amount = BigInt(amountMinor);
  const spent = BigInt(spentMinor);

  if (amount <= 0n) {
    return 0;
  }

  return Number((spent * 10_000n) / amount) / 100;
}

export function calculateRemainingBudget(amountMinor: number | bigint, spentMinor: number | bigint) {
  return BigInt(amountMinor) - BigInt(spentMinor);
}

export function groupExpensesByCategory(transactions: TransactionListItem[]): CategoryReportRow[] {
  return groupByCategory(transactions, "expense");
}

export function groupIncomeByCategory(transactions: TransactionListItem[]): CategoryReportRow[] {
  return groupByCategory(transactions, "income");
}

function groupByCategory(transactions: TransactionListItem[], kind: "income" | "expense"): CategoryReportRow[] {
  const map = new Map<string, CategoryReportRow>();

  for (const transaction of transactions) {
    if (transaction.kind !== kind || !transaction.categories) {
      continue;
    }

    const amount = transaction.transaction_entries.reduce(
      (sum, entry) => sum + (entry.amount_minor < 0 ? BigInt(-entry.amount_minor) : BigInt(entry.amount_minor)),
      0n,
    );

    const existing = map.get(transaction.categories.id);

    if (existing) {
      existing.amount_minor += Number(amount);
    } else {
      map.set(transaction.categories.id, {
        category_id: transaction.categories.id,
        category_name: transaction.categories.name,
        kind,
        amount_minor: Number(amount),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amount_minor - a.amount_minor);
}

export function convertToReportingCurrency(amountMinor: bigint, exchangeRate: string | number) {
  const [wholeRate, fractionRate = ""] = String(exchangeRate).split(".");
  const precision = BigInt(10 ** Math.max(fractionRate.length, 1));
  const rateMinor = BigInt(`${wholeRate}${fractionRate.padEnd(Number(precision.toString().length - 1), "0")}`);
  return (amountMinor * rateMinor) / precision;
}
