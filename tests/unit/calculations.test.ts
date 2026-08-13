import { describe, expect, it } from "vitest";
import {
  calculateBookBalance,
  calculateBudgetUsage,
  calculateCashFlow,
  calculateRemainingBudget,
  calculateWalletBalance,
  convertToReportingCurrency,
} from "@/lib/finance/calculations";

const priorbank = {
  id: "priorbank",
  opening_balance_minor: 50000,
  include_in_net_worth: true,
};

const cash = {
  id: "cash",
  opening_balance_minor: 10000,
  include_in_net_worth: true,
};

describe("financial calculations", () => {
  it("calculates income, expense and transfer balances from entries", () => {
    const entries = [
      { wallet_id: "priorbank", amount_minor: 300000 },
      { wallet_id: "priorbank", amount_minor: -12000 },
      { wallet_id: "priorbank", amount_minor: -30000 },
      { wallet_id: "cash", amount_minor: 30000 },
    ];

    expect(calculateWalletBalance(priorbank, entries)).toBe(308000n);
    expect(calculateWalletBalance(cash, entries)).toBe(40000n);
    expect(calculateBookBalance([priorbank, cash], entries)).toBe(348000n);
  });

  it("calculates cash flow without transfers", () => {
    expect(calculateCashFlow({ income_minor: 300000, expense_minor: 12000 })).toBe(288000n);
  });

  it("calculates budget progress", () => {
    expect(calculateBudgetUsage(80000, 60000)).toBe(75);
    expect(calculateRemainingBudget(80000, 60000)).toBe(20000n);
  });

  it("keeps foreign transfer amounts explicit", () => {
    expect(convertToReportingCurrency(10000n, "0.91")).toBe(9100n);
  });
});
