import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { BudgetProgress } from "@/lib/types";

export const getBudgetProgress = cache(async (bookId: string, onDate = new Date().toISOString().slice(0, 10)) => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_budget_progress", {
    p_book_id: bookId,
    p_on: onDate,
  });

  if (error) {
    throw error;
  }

  return data satisfies BudgetProgress[];
});
