import { describe, expect, it } from "vitest";
import { getDropHint, resolveDropAction, type DragEntity } from "@/lib/finance/drag-drop";

const salary: DragEntity = { id: "income-1", type: "income-category", name: "Зарплата" };
const groceries: DragEntity = { id: "expense-1", type: "expense-category", name: "Продукты" };
const card: DragEntity = { id: "wallet-1", type: "wallet", name: "Priorbank", currencyCode: "BYN" };
const cash: DragEntity = { id: "wallet-2", type: "wallet", name: "Наличные", currencyCode: "BYN" };

describe("resolveDropAction", () => {
  it("creates an income intent only from an income category to a wallet", () => {
    expect(resolveDropAction(salary, card)).toEqual({ kind: "income", categoryId: "income-1", walletId: "wallet-1" });
  });

  it("creates an expense intent only from a wallet to an expense category", () => {
    expect(resolveDropAction(card, groceries)).toEqual({ kind: "expense", walletId: "wallet-1", categoryId: "expense-1" });
  });

  it("creates a transfer intent between different wallets", () => {
    expect(resolveDropAction(card, cash)).toEqual({ kind: "transfer", sourceWalletId: "wallet-1", destinationWalletId: "wallet-2" });
  });

  it("rejects invalid drops and same-wallet transfers", () => {
    expect(resolveDropAction(salary, groceries)).toBeNull();
    expect(resolveDropAction(card, card)).toBeNull();
  });

  it("explains the active valid drop", () => {
    expect(getDropHint(card, groceries)).toBe("Отпустите, чтобы добавить расход");
  });
});
