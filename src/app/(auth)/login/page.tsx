import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Вход",
};

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Войти</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Продолжите учет в своем защищенном финансовом профиле.
        </p>
      </div>
      <LoginForm nextPath={nextPath} />
      <p className="text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link className="font-medium text-primary hover:underline" href="/register">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
