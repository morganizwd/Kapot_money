"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { retryFoundationAction } from "@/app/app/actions";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/types";

export function FoundationRetryForm() {
  const [state, action] = useActionState(retryFoundationAction, idleActionState);

  return (
    <form action={action} className="grid gap-3">
      <FormStatus state={state} />
      <SubmitButton pendingLabel="Проверяем">
        <RefreshCw aria-hidden className="size-4" />
        Повторить подготовку
      </SubmitButton>
    </form>
  );
}
