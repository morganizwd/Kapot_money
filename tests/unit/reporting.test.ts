import { describe, expect, it } from "vitest";
import { buildDailyReportRows, getTransactionAmountMinor } from "@/lib/finance/reporting";
import type { TransactionListItem } from "@/lib/types";

function transaction({
  date,
  kind,
  amounts,
}: {
  date: string;
  kind: TransactionListItem["kind"];
  amounts: number[];
}): TransactionListItem {
  return {
    id: crypto.randomUUID(),
    book_id: "book-1",
    kind,
    category_id: null,
    description: null,
    note: null,
    occurred_at: date,
    reporting_amount_minor: null,
    exchange_rate: null,
    created_at: date,
    updated_at: date,
    categories: null,
    transaction_entries: amounts.map((amount, index) => ({
      id: String(index),
      wallet_id: "wallet-1",
      amount_minor: amount,
      currency_code: "BYN",
      wallets: null,
    })),
  };
}

describe("reporting helpers", () => {
  it("builds a continuous daily series and keeps income and expenses separate", () => {
    const rows = buildDailyReportRows([
      transaction({ date: "2026-08-01T09:00:00.000Z", kind: "income", amounts: [120000] }),
      transaction({ date: "2026-08-03T15:00:00.000Z", kind: "expense", amounts: [-2500] }),
    ], "2026-08-01T00:00:00.000Z", "2026-08-03T23:59:59.999Z");

    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: "2026-08-01", income_minor: 120000, expense_minor: 0, cash_flow_minor: 120000 }),
      expect.objectContaining({ date: "2026-08-02", income_minor: 0, expense_minor: 0, cash_flow_minor: 0 }),
      expect.objectContaining({ date: "2026-08-03", income_minor: 0, expense_minor: 2500, cash_flow_minor: -2500 }),
    ]));
  });

  it("uses the absolute amount of transaction entries", () => {
    expect(getTransactionAmountMinor(transaction({ date: "2026-08-01T09:00:00.000Z", kind: "expense", amounts: [-1800] }))).toBe(1800);
  });
});
