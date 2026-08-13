import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = {
  title: "Новый пароль",
};

export default function ResetPasswordPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Новый пароль</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Укажите новый пароль для текущей восстановленной сессии.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
