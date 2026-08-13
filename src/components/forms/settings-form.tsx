"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateSettingsAction } from "@/app/app/actions";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { commonCurrencies } from "@/lib/finance/currencies";
import { idleActionState } from "@/lib/types";

type Profile = { display_name: string | null; default_currency: string; timezone: string; locale: string };

export function SettingsForm({ profile }: { profile: Profile | null }) {
  const [state, action] = useActionState(updateSettingsAction, idleActionState);
  return <form action={action} className="grid gap-4"><FormStatus state={state} /><div className="grid gap-2"><Label htmlFor="displayName">Имя</Label><Input id="displayName" name="displayName" defaultValue={profile?.display_name ?? ""} placeholder="Как к вам обращаться" /></div><div className="grid gap-4 sm:grid-cols-3"><div className="grid gap-2"><Label htmlFor="defaultCurrency">Валюта</Label><Select id="defaultCurrency" name="defaultCurrency" defaultValue={profile?.default_currency ?? "BYN"}>{commonCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</Select></div><div className="grid gap-2"><Label htmlFor="timezone">Часовой пояс</Label><Input id="timezone" name="timezone" defaultValue={profile?.timezone ?? "Europe/Minsk"} required /></div><div className="grid gap-2"><Label htmlFor="locale">Локаль</Label><Input id="locale" name="locale" defaultValue={profile?.locale ?? "ru"} required /></div></div><SubmitButton pendingLabel="Сохраняем" className="w-full sm:w-auto"><Save aria-hidden className="size-4" />Сохранить настройки</SubmitButton></form>;
}
