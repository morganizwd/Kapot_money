"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createWalletAction } from "@/app/app/actions";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { commonCurrencies } from "@/lib/finance/currencies";
import { idleActionState, type FinanceBook, type WalletType } from "@/lib/types";

const walletTypes: Array<{ value: WalletType; label: string }> = [{ value: "bank_card", label: "Карта" }, { value: "cash", label: "Наличные" }, { value: "bank_account", label: "Счёт" }, { value: "savings", label: "Накопления" }, { value: "deposit", label: "Депозит" }, { value: "ewallet", label: "Эл. кошелёк" }, { value: "credit", label: "Кредит" }, { value: "other", label: "Другое" }];

export function WalletForm({ book }: { book: FinanceBook }) {
  const [state, action] = useActionState(createWalletAction, idleActionState);
  return <form action={action} className="grid gap-4"><input type="hidden" name="bookId" value={book.id} /><FormStatus state={state} /><div className="grid gap-2"><Label htmlFor="wallet-name">Название</Label><Input id="wallet-name" name="name" placeholder="Например, Priorbank" required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="wallet-type">Тип</Label><Select id="wallet-type" name="type" defaultValue="bank_card">{walletTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</Select></div><div className="grid gap-2"><Label htmlFor="wallet-currency">Валюта</Label><Select id="wallet-currency" name="currencyCode" defaultValue={book.base_currency}>{commonCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</Select></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="opening-balance">Начальный остаток</Label><Input id="opening-balance" name="openingBalance" inputMode="decimal" defaultValue="0" required /></div><div className="grid gap-2"><Label htmlFor="opening-date">Дата остатка</Label><Input id="opening-date" name="openingBalanceDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></div></div><label className="flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] bg-muted px-3 text-sm font-medium"><input type="hidden" name="includeInNetWorth" value="false" /><input className="size-5 accent-primary" type="checkbox" name="includeInNetWorth" value="true" defaultChecked />Учитывать в общем балансе</label><SubmitButton pendingLabel="Создаём" className="w-full"><Plus aria-hidden className="size-5" />Создать кошелёк</SubmitButton></form>;
}
