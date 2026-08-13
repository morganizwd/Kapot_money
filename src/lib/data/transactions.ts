import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { TransactionKind, TransactionListItem } from "@/lib/types";

export type TransactionFilters = {
  kind?: TransactionKind | "all";
  walletId?: string;
  categoryId?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export const getTransactions = cache(async (bookId: string, filters: TransactionFilters = {}) => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("transactions")
    .select(
      `
      *,
      categories(id,name,kind,parent_id,icon),
      transaction_entries(
        id,
        wallet_id,
        amount_minor,
        currency_code,
        wallets(id,name,currency_code)
      )
    `,
    )
    .eq("book_id", bookId)
    .order("occurred_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.kind && filters.kind !== "all") {
    query = query.eq("kind", filters.kind);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.search) {
    query = query.or(`description.ilike.%${filters.search}%,note.ilike.%${filters.search}%`);
  }

  if (filters.from) {
    query = query.gte("occurred_at", filters.from);
  }

  if (filters.to) {
    query = query.lte("occurred_at", filters.to);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const transactions = (data ?? []) as unknown as TransactionListItem[];

  if (filters.walletId) {
    return transactions.filter((transaction) =>
      transaction.transaction_entries.some((entry) => entry.wallet_id === filters.walletId),
    );
  }

  return transactions;
});
