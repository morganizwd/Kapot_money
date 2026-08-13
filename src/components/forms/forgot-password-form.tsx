"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { forgotPasswordAction } from "@/app/(auth)/actions";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idleActionState } from "@/lib/types";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, idleActionState);

  return (
    <form action={action} className="grid gap-4">
      <FormStatus state={state} />
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <SubmitButton pendingLabel="Отправляем">
        <Send aria-hidden className="size-4" />
        Отправить ссылку
      </SubmitButton>
    </form>
  );
}
