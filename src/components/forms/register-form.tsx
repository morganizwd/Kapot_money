"use client";

import { useActionState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { signUpAction } from "@/app/(auth)/actions";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idleActionState } from "@/lib/types";

export function RegisterForm() {
  const [state, action] = useActionState(signUpAction, idleActionState);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="timezone" value="Europe/Minsk" />
      <input type="hidden" name="locale" value="ru" />
      <FormStatus state={state} />
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" name="email" type="email" autoComplete="email" required className="pl-9" />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="passwordConfirmation">Повтор пароля</Label>
          <Input id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" required />
        </div>
      </div>
      <SubmitButton pendingLabel="Создаем аккаунт">
        <UserPlus aria-hidden className="size-4" />
        Зарегистрироваться
      </SubmitButton>
    </form>
  );
}
