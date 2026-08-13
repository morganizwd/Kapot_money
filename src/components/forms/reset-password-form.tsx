"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idleActionState } from "@/lib/types";

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, idleActionState);

  return (
    <form action={action} className="grid gap-4">
      <FormStatus state={state} />
      <div className="grid gap-2">
        <Label htmlFor="password">Новый пароль</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="passwordConfirmation">Повтор пароля</Label>
        <Input id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" required />
      </div>
      <SubmitButton pendingLabel="Сохраняем">
        <KeyRound aria-hidden className="size-4" />
        Сменить пароль
      </SubmitButton>
    </form>
  );
}
