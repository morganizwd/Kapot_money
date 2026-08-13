import type { Metadata } from "next";
import { WalletsContent } from "@/components/app/wallets-content";
import { getActiveBook } from "@/lib/data/books";
import { getCategories } from "@/lib/data/categories";
import { getWalletBalances } from "@/lib/data/wallets";

export const metadata: Metadata = { title: "Кошельки" };

export default async function WalletsPage() {
  const book = await getActiveBook();
  if (!book) return null;
  const [wallets, categories] = await Promise.all([getWalletBalances(book.id), getCategories(book.id)]);
  return <WalletsContent book={book} wallets={wallets} categories={categories} />;
}
