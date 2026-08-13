"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { MoneyAmount, PageContainer } from "@/components/app/mobile-ui";
import { ReportChart } from "@/components/app/report-chart";
import { cn } from "@/lib/utils";
import type { CategoryReportRow, FinanceBook, PeriodSummary } from "@/lib/types";

export function ReportsContent({ book, summary, expenseRows, incomeRows }: { book: FinanceBook; summary: PeriodSummary; expenseRows: CategoryReportRow[]; incomeRows: CategoryReportRow[] }) {
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const rows = tab === "expense" ? expenseRows : incomeRows;
  const total = tab === "expense" ? summary.expense_minor : summary.income_minor;
  const month = new Intl.DateTimeFormat("ru-BY", { month: "long", year: "numeric" }).format(new Date());
  return <PageContainer className="grid gap-6"><header><p className="text-sm text-muted-foreground capitalize">{month}</p><h1 className="mt-1 text-[1.75rem] font-bold">Отчёты</h1></header><div className="grid grid-cols-2 gap-3"><Metric label="Доходы" amount={summary.income_minor} currency={book.base_currency} icon={ArrowUpRight} tone="income" /><Metric label="Расходы" amount={summary.expense_minor} currency={book.base_currency} icon={ArrowDownLeft} tone="expense" /></div><section className="rounded-[var(--radius-card)] border border-border bg-panel p-5 shadow-[var(--shadow-panel)]"><div className="inline-flex rounded-[var(--radius-control)] bg-muted p-1" role="tablist" aria-label="Тип отчёта"><button type="button" role="tab" aria-selected={tab === "expense"} onClick={() => setTab("expense")} className={cn("min-h-10 rounded-[10px] px-4 text-sm font-semibold transition", tab === "expense" ? "bg-panel shadow-sm" : "text-muted-foreground")}>Расходы</button><button type="button" role="tab" aria-selected={tab === "income"} onClick={() => setTab("income")} className={cn("min-h-10 rounded-[10px] px-4 text-sm font-semibold transition", tab === "income" ? "bg-panel shadow-sm" : "text-muted-foreground")}>Доходы</button></div><p className="mt-6 text-sm text-muted-foreground">{tab === "expense" ? "Всего расходов" : "Всего доходов"}</p><MoneyAmount amountMinor={total} currencyCode={book.base_currency} className={tab === "expense" ? "mt-1 text-3xl font-bold text-danger" : "mt-1 text-3xl font-bold text-success"} />{rows.length > 0 ? <><ReportChart rows={rows} currencyCode={book.base_currency} /><div className="mt-3 grid gap-3">{rows.map((row) => <ReportRow key={row.category_id} row={row} total={total} currency={book.base_currency} />)}</div></> : <div className="grid h-56 place-items-center text-center"><div><ChartNoAxesCombined aria-hidden className="mx-auto size-7 text-primary" /><p className="mt-3 text-sm font-semibold">Нет данных за период</p><p className="mt-1 text-sm text-muted-foreground">Добавьте операции, чтобы увидеть распределение.</p></div></div>}</section></PageContainer>;
}

function Metric({ label, amount, currency, icon: Icon, tone }: { label: string; amount: number; currency: string; icon: typeof ArrowUpRight; tone: "income" | "expense" }) {
  return <div className="rounded-[var(--radius-card)] bg-muted p-4"><span className={tone === "income" ? "grid size-9 place-items-center rounded-xl bg-success/10 text-success" : "grid size-9 place-items-center rounded-xl bg-danger/10 text-danger"}><Icon aria-hidden className="size-5" /></span><p className="mt-4 text-sm text-muted-foreground">{label}</p><MoneyAmount amountMinor={amount} currencyCode={currency} className={tone === "income" ? "mt-1 text-lg font-bold text-success" : "mt-1 text-lg font-bold text-danger"} /></div>;
}

function ReportRow({ row, total, currency }: { row: CategoryReportRow; total: number; currency: string }) {
  const percent = total > 0 ? Math.round((row.amount_minor / total) * 100) : 0;
  return <div><div className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-semibold">{row.category_name}</span><MoneyAmount amountMinor={row.amount_minor} currencyCode={currency} className="font-semibold" /></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, percent)}%` }} /></div></div>;
}
