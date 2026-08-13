"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, BarChart3, ChartNoAxesCombined, ChartSpline, CircleDashed } from "lucide-react";
import { MoneyAmount, PageContainer } from "@/components/app/mobile-ui";
import { ReportChart, ReportTimelineChart } from "@/components/app/report-chart";
import { ReportPdfExport } from "@/components/app/report-pdf-export";
import { buildDailyReportRows } from "@/lib/finance/reporting";
import { cn } from "@/lib/utils";
import type { CategoryReportRow, FinanceBook, PeriodSummary, TransactionListItem } from "@/lib/types";

export function ReportsContent({
  book,
  summary,
  expenseRows,
  incomeRows,
  transactions,
  from,
  to,
  periodLabel,
}: {
  book: FinanceBook;
  summary: PeriodSummary;
  expenseRows: CategoryReportRow[];
  incomeRows: CategoryReportRow[];
  transactions: TransactionListItem[];
  from: string;
  to: string;
  periodLabel: string;
}) {
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [chartVariant, setChartVariant] = useState<"donut" | "bar">("donut");
  const rows = tab === "expense" ? expenseRows : incomeRows;
  const total = tab === "expense" ? summary.expense_minor : summary.income_minor;
  const dailyRows = buildDailyReportRows(transactions, from, to);
  const hasTimelineData = dailyRows.some((row) => row.income_minor > 0 || row.expense_minor > 0);

  return (
    <PageContainer className="grid gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{periodLabel}</p>
          <h1 className="mt-1 text-[1.75rem] font-bold">Отчёты</h1>
        </div>
        <ReportPdfExport book={book} periodLabel={periodLabel} summary={summary} expenseRows={expenseRows} incomeRows={incomeRows} dailyRows={dailyRows} transactions={transactions} />
      </header>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Доходы" amount={summary.income_minor} currency={book.base_currency} icon={ArrowUpRight} tone="income" />
        <Metric label="Расходы" amount={summary.expense_minor} currency={book.base_currency} icon={ArrowDownLeft} tone="expense" />
      </div>
      <section className="rounded-[var(--radius-card)] border border-border bg-panel p-5 shadow-[var(--shadow-panel)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-[var(--radius-control)] bg-muted p-1" role="tablist" aria-label="Тип отчёта">
            <button type="button" role="tab" aria-selected={tab === "expense"} onClick={() => setTab("expense")} className={cn("min-h-10 rounded-[10px] px-4 text-sm font-semibold transition", tab === "expense" ? "bg-panel shadow-sm" : "text-muted-foreground")}>Расходы</button>
            <button type="button" role="tab" aria-selected={tab === "income"} onClick={() => setTab("income")} className={cn("min-h-10 rounded-[10px] px-4 text-sm font-semibold transition", tab === "income" ? "bg-panel shadow-sm" : "text-muted-foreground")}>Доходы</button>
          </div>
          {rows.length > 0 ? (
            <div className="inline-flex rounded-[var(--radius-control)] bg-muted p-1" role="tablist" aria-label="Вид диаграммы">
              <ChartVariantButton label="Кольцевая" icon={CircleDashed} selected={chartVariant === "donut"} onClick={() => setChartVariant("donut")} />
              <ChartVariantButton label="Столбцы" icon={BarChart3} selected={chartVariant === "bar"} onClick={() => setChartVariant("bar")} />
            </div>
          ) : null}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">{tab === "expense" ? "Всего расходов" : "Всего доходов"}</p>
        <MoneyAmount amountMinor={total} currencyCode={book.base_currency} className={tab === "expense" ? "mt-1 text-3xl font-bold text-danger" : "mt-1 text-3xl font-bold text-success"} />
        {rows.length > 0 ? (
          <>
            <ReportChart rows={rows} currencyCode={book.base_currency} variant={chartVariant} />
            <div className="mt-3 grid gap-3">{rows.map((row) => <ReportRow key={row.category_id} row={row} total={total} currency={book.base_currency} />)}</div>
          </>
        ) : (
          <div className="grid h-56 place-items-center text-center">
            <div>
              <ChartNoAxesCombined aria-hidden className="mx-auto size-7 text-primary" />
              <p className="mt-3 text-sm font-semibold">Нет данных за период</p>
              <p className="mt-1 text-sm text-muted-foreground">Добавьте операции, чтобы увидеть распределение.</p>
            </div>
          </div>
        )}
      </section>
      {hasTimelineData ? (
        <section className="rounded-[var(--radius-card)] border border-border bg-panel p-5 shadow-[var(--shadow-panel)]">
          <div className="flex items-center gap-2">
            <ChartSpline aria-hidden className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Динамика за месяц</h2>
          </div>
          <ReportTimelineChart rows={dailyRows} currencyCode={book.base_currency} />
        </section>
      ) : null}
    </PageContainer>
  );
}

function Metric({ label, amount, currency, icon: Icon, tone }: { label: string; amount: number; currency: string; icon: typeof ArrowUpRight; tone: "income" | "expense" }) {
  return <div className="rounded-[var(--radius-card)] bg-muted p-4"><span className={tone === "income" ? "grid size-9 place-items-center rounded-xl bg-success/10 text-success" : "grid size-9 place-items-center rounded-xl bg-danger/10 text-danger"}><Icon aria-hidden className="size-5" /></span><p className="mt-4 text-sm text-muted-foreground">{label}</p><MoneyAmount amountMinor={amount} currencyCode={currency} className={tone === "income" ? "mt-1 text-lg font-bold text-success" : "mt-1 text-lg font-bold text-danger"} /></div>;
}

function ReportRow({ row, total, currency }: { row: CategoryReportRow; total: number; currency: string }) {
  const percent = total > 0 ? Math.round((row.amount_minor / total) * 100) : 0;
  return <div><div className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-semibold">{row.category_name}</span><MoneyAmount amountMinor={row.amount_minor} currencyCode={currency} className="font-semibold" /></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, percent)}%` }} /></div></div>;
}

function ChartVariantButton({
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  icon: typeof CircleDashed;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" role="tab" aria-selected={selected} onClick={onClick} title={label} className={cn("grid size-10 place-items-center rounded-[10px] transition", selected ? "bg-panel text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
      <Icon aria-hidden className="size-4" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
