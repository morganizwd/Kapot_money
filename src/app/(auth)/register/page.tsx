import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "Регистрация",
};

export default function RegisterPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Создать аккаунт</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          После регистрации появится первый профиль с базовыми категориями.
        </p>
      </div>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link className="font-medium text-primary hover:underline" href="/login">
          Войти
        </Link>
      </p>
    </div>
  );
}
