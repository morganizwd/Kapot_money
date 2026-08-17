"use client";

import { useActionState, useEffect, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { adjustWalletBalanceAction } from "@/app/app/actions";
import { MoneyAmount } from "@/components/app/mobile-ui";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { minorToMajor } from "@/lib/finance/money";
import { idleActionState, type WalletBalance } from "@/lib/types";

export function WalletBalanceForm({ wallet, onSuccess }: { wallet: WalletBalance; onSuccess?: () => void }) {
  const [state, action] = useActionState(adjustWalletBalanceAction, idleActionState);
  const handledMessage = useRef<string | null>(null);

  useEffect(() => {
    if (state.status !== "success" || handledMessage.current === state.message) return;
    handledMessage.current = state.message;
    onSuccess?.();
  }, [onSuccess, state.message, state.status]);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="walletId" value={wallet.id} />
      <input type="hidden" name="occurredAt" value={new Date().toISOString().slice(0, 10)} />
      <FormStatus state={state} />

      <div className="rounded-[var(--radius-control)] bg-muted px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">Текущий баланс</p>
        <MoneyAmount amountMinor={wallet.current_balance_minor} currencyCode={wallet.currency_code} className="mt-1 text-xl font-bold" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`target-balance-${wallet.id}`}>Фактический баланс</Label>
        <div className="relative">
          <Input
            id={`target-balance-${wallet.id}`}
            name="targetBalance"
            inputMode="decimal"
            defaultValue={minorToMajor(wallet.current_balance_minor, wallet.currency_code)}
            className="pr-14 text-lg font-semibold"
            autoFocus
            required
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{wallet.currency_code}</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`balance-note-${wallet.id}`}>Комментарий</Label>
        <Textarea id={`balance-note-${wallet.id}`} name="note" placeholder="Например, сверка с банком" />
      </div>

      <SubmitButton pendingLabel="Корректируем" className="w-full">
        <SlidersHorizontal aria-hidden className="size-5" />
        Установить баланс
      </SubmitButton>
    </form>
  );
}
