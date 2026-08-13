import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Category, CategoryKind } from "@/lib/types";

async function loadCategories(bookId: string, kind?: CategoryKind) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("categories")
    .select("*")
    .eq("book_id", bookId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (kind) {
    query = query.eq("kind", kind);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data satisfies Category[];
}

export const getCategories = cache(loadCategories);
export const getCategoriesFresh = loadCategories;
