import type { Metadata } from "next";
import { BudgetsContent } from "@/components/app/budgets-content";
import { getBudgetProgress } from "@/lib/data/budgets";
import { getActiveBook } from "@/lib/data/books";
import { getCategories } from "@/lib/data/categories";

export const metadata: Metadata = { title: "Бюджеты" };

export default async function BudgetsPage() {
  const book = await getActiveBook();
  if (!book) return null;
  const [categories, budgets] = await Promise.all([getCategories(book.id, "expense"), getBudgetProgress(book.id)]);
  return <BudgetsContent book={book} categories={categories} budgets={budgets} />;
}
