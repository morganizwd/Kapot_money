export class AppError extends Error {
  constructor(
    message: string,
    public readonly code = "APP_ERROR",
  ) {
    super(message);
  }
}

export function mapSupabaseError(error: { message?: string; code?: string } | null) {
  if (!error) {
    return "Операция выполнена.";
  }

  const raw = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();

  if (
    raw.includes("pgrst202") ||
    raw.includes("pgrst205") ||
    raw.includes("42p01") ||
    raw.includes("42883") ||
    raw.includes("schema cache") ||
    raw.includes("could not find") ||
    raw.includes("does not exist")
  ) {
    return "Схема Supabase не применена, Data API не видит public-объекты или PostgREST ещё не обновил schema cache. Примените все миграции и перезапустите приложение.";
  }

  if (raw.includes("auth") || raw.includes("invalid login")) {
    return "Не удалось подтвердить учетные данные.";
  }

  if (raw.includes("wallet_not_found")) {
    return "Кошелёк больше не существует.";
  }

  if (raw.includes("category_not_found")) {
    return "Категория больше не существует.";
  }

  if (raw.includes("book_not_found")) {
    return "Финансовый профиль недоступен.";
  }

  if (raw.includes("permission") || raw.includes("rls") || raw.includes("row-level security") || raw.includes("not_found")) {
    return "Нет доступа к этим данным.";
  }

  if (raw.includes("duplicate") || raw.includes("23505")) {
    return "Такая запись уже существует.";
  }

  return "Не удалось сохранить изменения. Попробуйте ещё раз.";
}
