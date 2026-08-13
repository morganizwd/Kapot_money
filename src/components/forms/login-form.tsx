"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound, LogIn, Mail } from "lucide-react";
import { signInAction } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormStatus } from "@/components/forms/form-status";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idleActionState } from "@/lib/types";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action] = useActionState(signInAction, idleActionState);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? "/app"} />
      <FormStatus state={state} />
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" name="email" type="email" autoComplete="email" required className="pl-9" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <KeyRound aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="password" name="password" type="password" autoComplete="current-password" required className="pl-9" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-primary hover:underline" href="/forgot-password">
          Забыли пароль?
        </Link>
        <SubmitButton pendingLabel="Входим">
          <LogIn aria-hidden className="size-4" />
          Войти
        </SubmitButton>
      </div>
    </form>
  );
}
