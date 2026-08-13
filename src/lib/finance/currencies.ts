export const currencyFractionDigits: Record<string, number> = {
  BYN: 2,
  USD: 2,
  EUR: 2,
  RUB: 2,
  GBP: 2,
  PLN: 2,
  UAH: 2,
  JPY: 0,
  KRW: 0,
  KWD: 3,
  BHD: 3,
};

export function getCurrencyFractionDigits(currencyCode: string) {
  return currencyFractionDigits[currencyCode.toUpperCase()] ?? 2;
}

export const commonCurrencies = ["BYN", "USD", "EUR", "RUB", "PLN", "GBP"] as const;
