import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { FinanceBook } from "@/lib/types";

async function loadFinanceBooks() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("finance_books")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data satisfies FinanceBook[];
}

export const getFinanceBooks = cache(loadFinanceBooks);
export const getFinanceBooksFresh = loadFinanceBooks;

export const getActiveBook = cache(async (bookId?: string | null) => {
  const books = await getFinanceBooks();

  if (bookId) {
    const selected = books.find((book) => book.id === bookId);
    if (selected) {
      return selected;
    }
  }

  return books[0] ?? null;
});
