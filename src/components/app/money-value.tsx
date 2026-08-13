import { formatMoney } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

export function MoneyValue({
  amountMinor,
  currencyCode,
  className,
  sign = false,
}: {
  amountMinor: number | bigint;
  currencyCode: string;
  className?: string;
  sign?: boolean;
}) {
  const value = BigInt(amountMinor);
  const prefix = sign && value > 0n ? "+" : "";

  return <span className={cn("tabular-nums", className)}>{prefix}{formatMoney(value, currencyCode)}</span>;
}
