import { describe, expect, it } from "vitest";
import { formatMoney, majorToMinor, minorToMajor, parseMoney } from "@/lib/finance/money";

describe("money utilities", () => {
  it("parses decimal money into integer minor units", () => {
    expect(parseMoney("19.99", "BYN")).toBe(1999n);
    expect(parseMoney("100,00", "USD")).toBe(10000n);
    expect(parseMoney("8.50", "EUR")).toBe(850n);
  });

  it("supports currencies without fraction digits", () => {
    expect(parseMoney("1200", "JPY")).toBe(1200n);
    expect(minorToMajor(1200n, "JPY")).toBe("1200");
  });

  it("rejects over-precise values", () => {
    expect(() => parseMoney("1.999", "BYN")).toThrow("TOO_MANY_FRACTION_DIGITS");
  });

  it("formats minor units", () => {
    expect(formatMoney(350000n, "BYN")).toContain("3 500,00");
    expect(majorToMinor("91", "EUR")).toBe(9100n);
  });
});
