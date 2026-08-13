"use client";

import { useState } from "react";
import { CirclePlus, Target } from "lucide-react";
import { BottomSheet, MoneyAmount, PageContainer } from "@/components/app/mobile-ui";
import { BudgetForm } from "@/components/forms/budget-form";
import { Button } from "@/components/ui/button";
import type { BudgetProgress, Category, FinanceBook } from "@/lib/types";

export function BudgetsContent({ book, categories, budgets }: { book: FinanceBook; categories: Category[]; budgets: BudgetProgress[] }) {
  const [open, setOpen] = useState(false);
  return (
    <PageContainer className="grid gap-6">
      <header className="flex items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Лимиты на важные траты</p><h1 className="mt-1 text-[1.75rem] font-bold">Бюджеты</h1></div><Button size="icon" onClick={() => setOpen(true)} aria-label="Добавить бюджет"><CirclePlus aria-hidden className="size-6" /></Button></header>
      {budgets.length === 0 ? <section className="grid min-h-64 place-items-center rounded-[var(--radius-card)] border border-dashed border-border bg-panel px-5 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-primary"><Target aria-hidden className="size-7" /></span><h2 className="mt-4 text-lg font-semibold">Нет активных бюджетов</h2><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Создайте лимит для категории, чтобы видеть, сколько осталось до конца периода.</p><Button className="mt-5" onClick={() => setOpen(true)}>Добавить бюджет</Button></div></section> : <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{budgets.map((budget) => <BudgetCard key={budget.budget_id} budget={budget} />)}</section>}
      {open ? <BottomSheet title="Новый бюджет" onClose={() => setOpen(false)}><BudgetForm book={book} expenseCategories={categories} /></BottomSheet> : null}
    </PageContainer>
  );
}

function BudgetCard({ budget }: { budget: BudgetProgress }) {
  const percent = Math.max(0, Math.round(budget.progress_percent));
  const tone = percent > 100 ? "bg-danger" : percent > 70 ? "bg-warning" : "bg-primary";
  const remainingLabel = budget.remaining_minor < 0 ? "Превышение" : "Осталось";
  return <article className="rounded-[var(--radius-card)] border border-border bg-panel p-5 shadow-[var(--shadow-panel)]"><div className="flex items-start justify-between gap-3"><div><p className="text-base font-semibold">{budget.category_name}</p><p className="mt-1 text-sm text-muted-foreground">{budget.period === "monthly" ? "Этот месяц" : budget.period === "yearly" ? "Этот год" : "Выбранный период"}</p></div><span className={percent > 100 ? "rounded-full bg-danger/10 px-2.5 py-1 text-xs font-bold text-danger" : percent > 70 ? "rounded-full bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning" : "rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground"}>{percent}%</span></div><MoneyAmount amountMinor={budget.spent_minor} currencyCode={budget.currency_code} className="mt-6 text-2xl font-bold" /><span className="text-sm text-muted-foreground"> из <MoneyAmount amountMinor={budget.amount_minor} currencyCode={budget.currency_code} /></span><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, percent)}%` }} /></div><div className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{remainingLabel}</span><MoneyAmount amountMinor={Math.abs(budget.remaining_minor)} currencyCode={budget.currency_code} className={budget.remaining_minor < 0 ? "font-semibold text-danger" : "font-semibold"} /></div></article>;
}
