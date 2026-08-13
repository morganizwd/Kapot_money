"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FormStatus({ state }: { state: ActionState }) {
  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        state.status === "success"
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-danger/30 bg-danger/10 text-danger",
      )}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}
