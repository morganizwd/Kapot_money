import type { Metadata } from "next";
import { ReportsContent } from "@/components/app/reports-content";
import { getActiveBook } from "@/lib/data/books";
import { getCategoryReport, getPeriodSummary } from "@/lib/data/reports";
import { endOfCurrentMonth, startOfCurrentMonth } from "@/lib/utils";

export const metadata: Metadata = { title: "Отчёты" };

export default async function ReportsPage() {
  const book = await getActiveBook();
  if (!book) return null;
  const from = startOfCurrentMonth().toISOString();
  const to = endOfCurrentMonth().toISOString();
  const [summary, expenseRows, incomeRows] = await Promise.all([getPeriodSummary(book.id, from, to), getCategoryReport(book.id, from, to, "expense"), getCategoryReport(book.id, from, to, "income")]);
  return <ReportsContent book={book} summary={summary} expenseRows={expenseRows} incomeRows={incomeRows} />;
}
