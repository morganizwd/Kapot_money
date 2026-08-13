import type { Metadata } from "next";
import { TransactionFilters } from "@/components/app/transaction-filters";
import { TransactionList } from "@/components/app/transaction-list";
import { PageContainer } from "@/components/app/mobile-ui";
import { getActiveBook } from "@/lib/data/books";
import { getCategories } from "@/lib/data/categories";
import { getTransactions } from "@/lib/data/transactions";
import { getWalletBalances } from "@/lib/data/wallets";

export const metadata: Metadata = { title: "История" };

type TransactionsPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = searchParams ? await searchParams : {};
  const book = await getActiveBook();
  if (!book) return null;

  const kind = single(params.kind);
  const walletId = single(params.walletId);
  const categoryId = single(params.categoryId);
  const search = single(params.search);
  const [wallets, categories] = await Promise.all([getWalletBalances(book.id), getCategories(book.id)]);
  const transactions = await getTransactions(book.id, { kind: kind === "income" || kind === "expense" || kind === "transfer" || kind === "adjustment" ? kind : "all", walletId, categoryId, search });

  return <PageContainer className="grid gap-6"><header><p className="text-sm text-muted-foreground">Все движения денег</p><h1 className="mt-1 text-[1.75rem] font-bold">История</h1></header><TransactionFilters wallets={wallets} categories={categories} count={transactions.length} /><TransactionList transactions={transactions} book={book} wallets={wallets} categories={categories} /></PageContainer>;
}

function single(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
