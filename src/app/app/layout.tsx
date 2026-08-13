import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { FoundationError } from "@/components/app/foundation-error";
import { SetupRequired } from "@/components/app/setup-required";
import { ensureUserFoundation, requireUser } from "@/lib/data/auth";
import { getFinanceBooks, getFinanceBooksFresh } from "@/lib/data/books";
import { getCategories, getCategoriesFresh } from "@/lib/data/categories";
import { getWalletBalances } from "@/lib/data/wallets";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Category, WalletBalance } from "@/lib/types";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const [user, initialBooks] = await Promise.all([
    requireUser(),
    getFinanceBooks().catch(() => null),
  ]);

  if (!initialBooks) {
    return <FoundationError message="Не удалось прочитать финансовые профили." />;
  }

  let books = initialBooks;
  let foundationError: Error | null = null;

  if (books.length === 0) {
    try {
      await ensureUserFoundation();
      books = await getFinanceBooksFresh();
    } catch (error) {
      foundationError = error instanceof Error ? error : new Error("Не удалось подготовить профиль.");
    }

    if (books.length === 0 && foundationError) {
      return <FoundationError message={foundationError.message} />;
    }
  }

  const activeBook = books[0] ?? null;
  let quickWallets: WalletBalance[] = [];
  let quickCategories: Category[] = [];

  if (activeBook) {
    try {
      [quickWallets, quickCategories] = await Promise.all([getWalletBalances(activeBook.id), getCategories(activeBook.id)]);

      if (quickCategories.length === 0) {
        await ensureUserFoundation();
        quickCategories = await getCategoriesFresh(activeBook.id);
      }
    } catch {
      quickWallets = [];
      quickCategories = [];
    }
  }

  return <AppShell books={books} userEmail={user.email ?? "Аккаунт"} activeBook={activeBook} quickWallets={quickWallets} quickCategories={quickCategories}>{children}</AppShell>;
}
