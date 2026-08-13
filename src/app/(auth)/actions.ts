"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  authSchema,
  forgotPasswordSchema,
  formDataToObject,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/schemas";
import type { ActionState } from "@/lib/types";
import { mapSupabaseError } from "@/lib/data/errors";
import { ensureUserFoundation } from "@/lib/data/auth";

function validationError(message = "Проверьте заполненные поля."): ActionState {
  return { status: "error", message };
}

function safeNextPath(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/app";
}

export async function signInAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Добавьте Supabase переменные окружения и перезапустите приложение." };
  }

  const parsed = authSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: mapSupabaseError(error) };
  }

  try {
    await ensureUserFoundation();
  } catch {
    redirect("/app?setup=manual");
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signUpAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Добавьте Supabase переменные окружения и перезапустите приложение." };
  }

  const parsed = registerSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message);
  }

  const supabase = await createSupabaseServerClient();
  const { email, password, timezone, locale } = parsed.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        timezone,
        locale,
        default_currency: "BYN",
      },
    },
  });

  if (error) {
    return { status: "error", message: mapSupabaseError(error) };
  }

  if (data.session) {
    try {
      await ensureUserFoundation();
    } catch {
      redirect("/app?setup=manual");
    }

    redirect("/app");
  }

  return {
    status: "error",
    message: "Не удалось автоматически войти после регистрации. Отключите Confirm Email в настройках Supabase Auth.",
  };
}

export async function forgotPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Добавьте Supabase переменные окружения и перезапустите приложение." };
  }

  const parsed = forgotPasswordSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { status: "error", message: mapSupabaseError(error) };
  }

  return { status: "success", message: "Если email зарегистрирован, ссылка для восстановления отправлена." };
}

export async function resetPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Добавьте Supabase переменные окружения и перезапустите приложение." };
  }

  const parsed = resetPasswordSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: mapSupabaseError(error) };
  }

  redirect("/app");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
