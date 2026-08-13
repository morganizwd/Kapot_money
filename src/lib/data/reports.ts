import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CategoryKind, CategoryReportRow, PeriodSummary } from "@/lib/types";

export const getPeriodSummary = cache(async (bookId: string, from: string, to: string) => {
  if (!isSupabaseConfigured()) {
    return {
      income_minor: 0,
      expense_minor: 0,
      cash_flow_minor: 0,
    } satisfies PeriodSummary;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_period_summary", {
    p_book_id: bookId,
    p_from: from,
    p_to: to,
  });

  if (error) {
    throw error;
  }

  return (
    data?.[0] ?? {
      income_minor: 0,
      expense_minor: 0,
      cash_flow_minor: 0,
    }
  ) satisfies PeriodSummary;
});

export const getCategoryReport = cache(async (bookId: string, from: string, to: string, kind: CategoryKind) => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_category_report", {
    p_book_id: bookId,
    p_from: from,
    p_to: to,
    p_kind: kind,
  });

  if (error) {
    throw error;
  }

  return data satisfies CategoryReportRow[];
});
