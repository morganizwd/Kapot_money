import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { WalletBalance } from "@/lib/types";

export const getWalletBalances = cache(async (bookId: string) => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_wallet_balances", {
    p_book_id: bookId,
  });

  if (error) {
    throw error;
  }

  return data satisfies WalletBalance[];
});
