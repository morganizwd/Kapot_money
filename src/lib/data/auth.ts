import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AppError, mapSupabaseError } from "@/lib/data/errors";
import type { Database } from "@/lib/supabase/database.types";

const incomeCategories = ["Зарплата", "Подработка", "Бизнес", "Продажи", "Подарки", "Проценты", "Прочее"];
const expenseCategories = [
  "Продукты",
  "Кафе",
  "Автомобиль",
  "Дом",
  "Развлечения",
  "Подписки",
  "Одежда",
  "Здоровье",
  "Подарки",
  "Путешествия",
  "Образование",
  "Связь",
  "Другое",
];

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function ensureUserFoundation() {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured", "SUPABASE_NOT_CONFIGURED");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("ensure_user_foundation");

  if (data && !error) {
    return data;
  }

  const fallbackBookId = await ensureUserFoundationWithRls(supabase);

  if (fallbackBookId) {
    return fallbackBookId;
  }

  if (error || !data) {
    throw new AppError(mapSupabaseError(error), error?.code);
  }

  return data;
}

async function ensureUserFoundationWithRls(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileReadError } = await supabase
    .from("user_profiles")
    .select("default_currency")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    return null;
  }

  if (!profile) {
    const { error: profileInsertError } = await supabase.from("user_profiles").insert({
      id: user.id,
      default_currency: "BYN",
      timezone: "Europe/Minsk",
      locale: "ru",
    });

    if (profileInsertError) {
      return null;
    }
  }

  const defaultCurrency = profile?.default_currency ?? "BYN";
  const { data: existingBooks, error: bookReadError } = await supabase
    .from("finance_books")
    .select("id")
    .eq("is_archived", false)
    .order("created_at", { ascending: true })
    .limit(1);

  if (bookReadError) {
    return null;
  }

  const existingBookId = existingBooks?.[0]?.id;

  if (existingBookId) {
    await ensureDefaultCategories(supabase, existingBookId);
    return existingBookId;
  }

  const { data: book, error: bookInsertError } = await supabase
    .from("finance_books")
    .insert({
      owner_id: user.id,
      name: "Личные финансы",
      base_currency: defaultCurrency,
      icon: "wallet",
    })
    .select("id")
    .single();

  if (bookInsertError || !book) {
    return null;
  }

  const categoriesCreated = await ensureDefaultCategories(supabase, book.id);
  return categoriesCreated ? book.id : null;
}

async function ensureDefaultCategories(supabase: SupabaseClient<Database>, bookId: string) {
  const { count, error: countError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("book_id", bookId);

  if (countError) {
    return false;
  }

  if ((count ?? 0) > 0) {
    return true;
  }

  const rows = [
    ...incomeCategories.map((name, index) => ({
      book_id: bookId,
      name,
      kind: "income" as const,
      sort_order: index * 10,
    })),
    ...expenseCategories.map((name, index) => ({
      book_id: bookId,
      name,
      kind: "expense" as const,
      sort_order: index * 10,
    })),
  ];

  const { error } = await supabase.from("categories").insert(rows);
  return !error;
}
