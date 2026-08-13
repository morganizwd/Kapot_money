"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createBookAction } from "@/app/app/actions";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { commonCurrencies } from "@/lib/finance/currencies";
import { idleActionState } from "@/lib/types";

export function BookForm() {
  const [state, action] = useActionState(createBookAction, idleActionState);
  return <form action={action} className="grid gap-4"><FormStatus state={state} /><div className="grid gap-2"><Label htmlFor="book-name">Название</Label><Input id="book-name" name="name" placeholder="Например, Личные финансы" required /></div><div className="grid gap-2"><Label htmlFor="book-currency">Базовая валюта</Label><Select id="book-currency" name="baseCurrency" defaultValue="BYN">{commonCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</Select></div><SubmitButton pendingLabel="Создаём" className="w-full"><Plus aria-hidden className="size-5" />Создать профиль</SubmitButton></form>;
}
