import { getCurrencyFractionDigits } from "@/lib/finance/currencies";

export function majorToMinor(value: string | number | bigint, currencyCode: string) {
  if (typeof value === "bigint") {
    return value;
  }

  return parseMoney(String(value), currencyCode);
}

export function minorToMajor(amountMinor: number | bigint, currencyCode: string) {
  const digits = getCurrencyFractionDigits(currencyCode);
  const divisor = 10n ** BigInt(digits);
  const amount = BigInt(amountMinor);
  const sign = amount < 0n ? "-" : "";
  const absolute = amount < 0n ? -amount : amount;

  if (digits === 0) {
    return `${sign}${absolute.toString()}`;
  }

  const whole = absolute / divisor;
  const fraction = (absolute % divisor).toString().padStart(digits, "0");
  return `${sign}${whole.toString()}.${fraction}`;
}

export function parseMoney(rawValue: string, currencyCode: string) {
  const digits = getCurrencyFractionDigits(currencyCode);
  const normalized = rawValue.trim().replace(/\s+/g, "").replace(",", ".");

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("INVALID_MONEY");
  }

  const sign = normalized.startsWith("-") ? -1n : 1n;
  const unsigned = normalized.replace(/^-/, "");
  const [wholePart, fractionPart = ""] = unsigned.split(".");

  if (fractionPart.length > digits) {
    throw new Error("TOO_MANY_FRACTION_DIGITS");
  }

  const whole = BigInt(wholePart || "0");
  const fraction = BigInt(fractionPart.padEnd(digits, "0") || "0");
  const divisor = 10n ** BigInt(digits);

  return sign * (whole * divisor + fraction);
}

export function formatMoney(amountMinor: number | bigint, currencyCode: string, locale = "ru-BY") {
  const digits = getCurrencyFractionDigits(currencyCode);
  const amountAsText = minorToMajor(amountMinor, currencyCode);
  const amountAsNumber = Number(amountAsText);

  if (Number.isSafeInteger(Number(amountMinor))) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amountAsNumber);
  }

  return `${amountAsText} ${currencyCode}`;
}

export function toSafeIntegerMinor(amountMinor: bigint) {
  const asNumber = Number(amountMinor);

  if (!Number.isSafeInteger(asNumber)) {
    throw new Error("MONEY_AMOUNT_TOO_LARGE");
  }

  return asNumber;
}

export function addMinor(values: Array<number | bigint>) {
  return values.reduce<bigint>((sum, value) => sum + BigInt(value), 0n);
}
