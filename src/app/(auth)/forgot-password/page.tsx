import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = {
  title: "Восстановление пароля",
};

export default function ForgotPasswordPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Восстановить пароль</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Отправим ссылку для безопасной смены пароля на ваш email.
        </p>
      </div>
      <ForgotPasswordForm />
      <Link className="text-sm font-medium text-primary hover:underline" href="/login">
        Вернуться ко входу
      </Link>
    </div>
  );
}
