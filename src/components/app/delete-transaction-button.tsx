"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteTransactionAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";

export function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Удалить операцию?")) {
          return;
        }

        startTransition(async () => {
          const formData = new FormData();
          formData.set("transactionId", transactionId);
          const result = await deleteTransactionAction(formData);

          if (result.status === "success") {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        });
      }}
    >
      <Trash2 aria-hidden className="size-4" />
      Удалить
    </Button>
  );
}
