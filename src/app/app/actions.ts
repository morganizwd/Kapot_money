"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AppError, mapSupabaseError } from "@/lib/data/errors";
import { ensureUserFoundation, requireUser } from "@/lib/data/auth";
import { parseMoney, toSafeIntegerMinor } from "@/lib/finance/money";
import {
  budgetSchema,
  categorySchema,
  financeBookSchema,
  formDataToObject,
  settingsSchema,
  transactionSchema,
  uuidSchema,
  walletSchema,
} from "@/lib/validation/schemas";
import type { ActionState, TransactionKind } from "@/lib/types";

function requireSupabase(): ActionState | null {
  return isSupabaseConfigured()
    ? null
    : { status: "error", message: "Supabase не настроен. Заполните `.env.local` и примените миграции." };
}

function firstIssue(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "Проверьте заполненные поля.";
}

function asTimestamp(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00.000Z`).toISOString();
  }

  return new Date(value).toISOString();
}

function mapKindLabel(kind: TransactionKind) {
  return {
    income: "Доход сохранен.",
    expense: "Расход сохранен.",
    transfer: "Перевод сохранен.",
    adjustment: "Корректировка сохранена.",
  }[kind];
}

export async function createBookAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const configurationError = requireSupabase();
  if (configurationError) return configurationError;

  const parsed = financeBookSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("finance_books").insert({
    owner_id: user.id,
    name: parsed.data.name,
    base_currency: parsed.data.baseCurrency,
    icon: parsed.data.icon || null,
  });

  if (error) return { status: "error", message: mapSupabaseError(error) };

  revalidatePath("/app");
  return { status: "success", message: "Финансовый профиль создан." };
}

export async function createWalletAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const configurationError = requireSupabase();
  if (configurationError) return configurationError;

  await requireUser();
  const parsed = walletSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  let openingBalanceMinor: number;

  try {
    openingBalanceMinor = toSafeIntegerMinor(parseMoney(parsed.data.openingBalance, parsed.data.currencyCode));
  } catch {
    return { status: "error", message: "Введите корректный начальный остаток." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("wallets").insert({
    book_id: parsed.data.bookId,
    name: parsed.data.name,
    type: parsed.data.type,
    currency_code: parsed.data.currencyCode,
    opening_balance_minor: openingBalanceMinor,
    opening_balance_date: parsed.data.openingBalanceDate,
    include_in_net_worth: parsed.data.includeInNetWorth,
  });

  if (error) return { status: "error", message: mapSupabaseError(error) };

  revalidatePath("/app");
  revalidatePath("/app/wallets");
  return { status: "success", message: "Кошелёк создан." };
}

export async function createCategoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const configurationError = requireSupabase();
  if (configurationError) return configurationError;

  await requireUser();
  const parsed = categorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").insert({
    book_id: parsed.data.bookId,
    name: parsed.data.name,
    kind: parsed.data.kind,
    parent_id: parsed.data.parentId,
    icon: parsed.data.icon,
  });

  if (error) return { status: "error", message: mapSupabaseError(error) };

  revalidatePath("/app");
  return { status: "success", message: "Категория создана." };
}

export async function createTransactionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  return persistTransaction(formData, null);
}

export async function updateTransactionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const transactionId = formData.get("transactionId");
  const parsedTransactionId = uuidSchema.safeParse(transactionId);

  if (!parsedTransactionId.success) {
    return { status: "error", message: "Операция не найдена." };
  }

  return persistTransaction(formData, parsedTransactionId.data);
}

async function persistTransaction(formData: FormData, transactionId: string | null): Promise<ActionState> {
  const configurationError = requireSupabase();
  if (configurationError) return configurationError;

  await requireUser();
  const parsed = transactionSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const payload = parsed.data;
  const amount = parseTransactionAmount(payload.amount, payload.currencyCode);
  if (!amount.ok) return { status: "error", message: amount.message };

  const entries:
    | Array<{ wallet_id: string; amount_minor: string; currency_code: string }>
    | null = buildEntries(payload, amount.value);

  if (!entries) {
    return { status: "error", message: "Проверьте кошельки и тип операции." };
  }

  const receivedEntry = entries.find((entry) => BigInt(entry.amount_minor) > 0n);
  const sentEntry = entries.find((entry) => BigInt(entry.amount_minor) < 0n);
  const exchangeRate =
    payload.kind === "transfer" && receivedEntry && sentEntry
      ? Math.abs(Number(receivedEntry.amount_minor) / Number(sentEntry.amount_minor)).toFixed(8)
      : null;

  const supabase = await createSupabaseServerClient();
  const rpcArgs = {
    p_kind: payload.kind,
    p_category_id: payload.categoryId,
    p_description: payload.description || null,
    p_note: payload.note || null,
    p_occurred_at: asTimestamp(payload.occurredAt),
    p_entries: entries,
    p_reporting_amount_minor: null,
    p_exchange_rate: exchangeRate,
  };

  const { error } = transactionId
    ? await supabase.rpc("update_financial_transaction", {
        ...rpcArgs,
        p_transaction_id: transactionId,
      })
    : await supabase.rpc("create_financial_transaction", {
        ...rpcArgs,
        p_book_id: payload.bookId,
        p_idempotency_key: crypto.randomUUID(),
      });

  if (error) return { status: "error", message: mapSupabaseError(error) };

  revalidatePath("/app");
  revalidatePath("/app/transactions");
  revalidatePath("/app/budgets");
  revalidatePath("/app/reports");
  return { status: "success", message: transactionId ? "Операция обновлена." : mapKindLabel(payload.kind) };
}

function parseTransactionAmount(rawAmount: string, currencyCode: string): { ok: true; value: bigint } | { ok: false; message: string } {
  try {
    const value = parseMoney(rawAmount, currencyCode);

    if (value <= 0n) {
      return { ok: false, message: "Сумма должна быть больше нуля." };
    }

    return { ok: true, value };
  } catch {
    return { ok: false, message: "Введите корректную сумму." };
  }
}

function buildEntries(
  payload: {
    kind: TransactionKind;
    sourceWalletId: string | null;
    destinationWalletId: string | null;
    amount: string;
    receivedAmount?: string;
    currencyCode: string;
    destinationCurrencyCode?: string;
  },
  amountMinor: bigint,
) {
  if (payload.kind === "income") {
    if (!payload.destinationWalletId) return null;
    return [
      {
        wallet_id: payload.destinationWalletId,
        amount_minor: amountMinor.toString(),
        currency_code: payload.currencyCode,
      },
    ];
  }

  if (payload.kind === "expense") {
    if (!payload.sourceWalletId) return null;
    return [
      {
        wallet_id: payload.sourceWalletId,
        amount_minor: (-amountMinor).toString(),
        currency_code: payload.currencyCode,
      },
    ];
  }

  if (payload.kind === "adjustment") {
    if (!payload.sourceWalletId) return null;
    return [
      {
        wallet_id: payload.sourceWalletId,
        amount_minor: amountMinor.toString(),
        currency_code: payload.currencyCode,
      },
    ];
  }

  if (!payload.sourceWalletId || !payload.destinationWalletId || payload.sourceWalletId === payload.destinationWalletId) {
    return null;
  }

  const receivedAmount = payload.receivedAmount && payload.receivedAmount.length > 0 ? payload.receivedAmount : payload.amount;
  const destinationCurrency = payload.destinationCurrencyCode ?? payload.currencyCode;

  try {
    const receivedMinor = parseMoney(receivedAmount, destinationCurrency);

    if (receivedMinor <= 0n) return null;

    return [
      {
        wallet_id: payload.sourceWalletId,
        amount_minor: (-amountMinor).toString(),
        currency_code: payload.currencyCode,
      },
      {
        wallet_id: payload.destinationWalletId,
        amount_minor: receivedMinor.toString(),
        currency_code: destinationCurrency,
      },
    ];
  } catch {
    return null;
  }
}

export async function deleteTransactionAction(formData: FormData) {
  const configurationError = requireSupabase();
  if (configurationError) return configurationError;

  await requireUser();
  const parsed = uuidSchema.safeParse(formData.get("transactionId"));
  if (!parsed.success) return { status: "error", message: "Операция не найдена." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_financial_transaction", {
    p_transaction_id: parsed.data,
  });

  if (error) return { status: "error", message: mapSupabaseError(error) };

  revalidatePath("/app");
  revalidatePath("/app/transactions");
  revalidatePath("/app/budgets");
  revalidatePath("/app/reports");
  return { status: "success", message: "Операция удалена." };
}

export async function createBudgetAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const configurationError = requireSupabase();
  if (configurationError) return configurationError;

  await requireUser();
  const parsed = budgetSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  let amountMinor: number;

  try {
    amountMinor = toSafeIntegerMinor(parseMoney(parsed.data.amount, parsed.data.currencyCode));
  } catch {
    return { status: "error", message: "Введите корректный бюджет." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("budgets").insert({
    book_id: parsed.data.bookId,
    category_id: parsed.data.categoryId,
    amount_minor: amountMinor,
    currency_code: parsed.data.currencyCode,
    period: parsed.data.period,
    starts_on: parsed.data.startsOn,
    ends_on: parsed.data.endsOn || null,
  });

  if (error) return { status: "error", message: mapSupabaseError(error) };

  revalidatePath("/app");
  revalidatePath("/app/budgets");
  return { status: "success", message: "Бюджет создан." };
}

export async function updateSettingsAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const configurationError = requireSupabase();
  if (configurationError) return configurationError;

  const user = await requireUser();
  const parsed = settingsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("user_profiles").upsert({
    id: user.id,
    display_name: parsed.data.displayName || null,
    default_currency: parsed.data.defaultCurrency,
    timezone: parsed.data.timezone,
    locale: parsed.data.locale,
  });

  if (error) return { status: "error", message: mapSupabaseError(error) };

  revalidatePath("/app/settings");
  return { status: "success", message: "Настройки сохранены." };
}

export async function bootstrapFoundationAction(): Promise<void> {
  const configurationError = requireSupabase();
  if (configurationError) return;

  await requireUser();
  try {
    await ensureUserFoundation();
  } catch {
    return;
  }
  revalidatePath("/app");
  redirect("/app");
}

export async function retryFoundationAction(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  void _prevState;
  void _formData;

  const configurationError = requireSupabase();
  if (configurationError) return configurationError;

  await requireUser();

  try {
    await ensureUserFoundation();
  } catch (error) {
    if (error instanceof AppError) {
      return { status: "error", message: error.message };
    }

    return {
      status: "error",
      message: "Профиль не подготовился. Проверьте диагностику схемы ниже и примените миграции Supabase.",
    };
  }

  revalidatePath("/app");
  redirect("/app");
}
