"use client";

import { useActionState } from "react";
import { Target } from "lucide-react";
import { createBudgetAction } from "@/app/app/actions";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { idleActionState, type Category, type FinanceBook } from "@/lib/types";

export function BudgetForm({ book, expenseCategories }: { book: FinanceBook; expenseCategories: Category[] }) {
  const [state, action] = useActionState(createBudgetAction, idleActionState);
  const today = new Date();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)).toISOString().slice(0, 10);
  return <form action={action} className="grid gap-4"><input type="hidden" name="bookId" value={book.id} /><input type="hidden" name="currencyCode" value={book.base_currency} /><FormStatus state={state} /><div className="grid gap-2"><Label htmlFor="budget-category">Категория</Label><Select id="budget-category" name="categoryId" required>{expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="budget-amount">Лимит</Label><Input id="budget-amount" name="amount" inputMode="decimal" placeholder="800" required /></div><div className="grid gap-2"><Label htmlFor="budget-period">Период</Label><Select id="budget-period" name="period" defaultValue="monthly"><option value="monthly">Месяц</option><option value="yearly">Год</option><option value="custom">Диапазон</option></Select></div></div><div className="grid gap-2"><Label htmlFor="budget-start">Начало периода</Label><Input id="budget-start" name="startsOn" type="date" defaultValue={monthStart} required /></div><details className="rounded-[var(--radius-control)] border border-border p-3"><summary className="cursor-pointer text-sm font-semibold text-muted-foreground">Дополнительно</summary><div className="mt-3 grid gap-2"><Label htmlFor="budget-end">Дата окончания</Label><Input id="budget-end" name="endsOn" type="date" /></div></details><SubmitButton pendingLabel="Создаём" className="w-full"><Target aria-hidden className="size-5" />Создать бюджет</SubmitButton></form>;
}
