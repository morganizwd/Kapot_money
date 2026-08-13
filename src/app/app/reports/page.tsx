import type { Metadata } from "next";
import { ReportsContent } from "@/components/app/reports-content";
import { getActiveBook } from "@/lib/data/books";
import { getCategoryReport, getPeriodSummary } from "@/lib/data/reports";
import { getTransactions } from "@/lib/data/transactions";
import { startOfCurrentMonth } from "@/lib/utils";

export const metadata: Metadata = { title: "Отчёты" };

export default async function ReportsPage() {
  const book = await getActiveBook();
  if (!book) return null;
  const from = startOfCurrentMonth().toISOString();
  const to = new Date().toISOString();
  const periodLabel = new Intl.DateTimeFormat("ru-BY", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date());
  const [summary, expenseRows, incomeRows, transactions] = await Promise.all([
    getPeriodSummary(book.id, from, to),
    getCategoryReport(book.id, from, to, "expense"),
    getCategoryReport(book.id, from, to, "income"),
    getTransactions(book.id, { from, to, limit: 1000 }),
  ]);
  return <ReportsContent book={book} summary={summary} expenseRows={expenseRows} incomeRows={incomeRows} transactions={transactions} from={from} to={to} periodLabel={periodLabel} />;
}
