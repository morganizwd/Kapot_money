import { describe, expect, it } from "vitest";
import { registerSchema, transactionSchema, walletBalanceAdjustmentSchema, walletSchema } from "@/lib/validation/schemas";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("validation schemas", () => {
  it("rejects mismatched registration passwords", () => {
    const result = registerSchema.safeParse({
      email: "person@example.com",
      password: "password123",
      passwordConfirmation: "different123",
      timezone: "Europe/Minsk",
      locale: "ru",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes wallet currency", () => {
    const result = walletSchema.safeParse({
      bookId: uuid,
      name: "Priorbank",
      type: "bank_card",
      currencyCode: "byn",
      openingBalance: "500",
      openingBalanceDate: "2026-08-13",
      includeInNetWorth: true,
    });

    expect(result.success).toBe(true);
    expect(result.success ? result.data.currencyCode : "").toBe("BYN");
  });

  it("requires a positive user-entered amount shape", () => {
    const result = transactionSchema.safeParse({
      bookId: uuid,
      kind: "expense",
      categoryId: uuid,
      sourceWalletId: uuid,
      amount: "12.50",
      currencyCode: "BYN",
      occurredAt: "2026-08-13",
    });

    expect(result.success).toBe(true);
  });

  it("allows a negative target balance for wallet corrections", () => {
    const result = walletBalanceAdjustmentSchema.safeParse({
      walletId: uuid,
      targetBalance: "-125,50",
      occurredAt: "2026-08-17",
      note: "Balance check",
    });

    expect(result.success).toBe(true);
  });
});
