import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { FoundationRetryForm } from "@/components/app/foundation-retry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseSchemaDiagnostics } from "@/lib/data/schema-diagnostics";
import { cn } from "@/lib/utils";

export async function FoundationError({ message }: { message: string }) {
  const diagnostics = await getSupabaseSchemaDiagnostics();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle aria-hidden className="size-5 text-accent" />
            Профиль не подготовился
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground">
          <p>{message}</p>
          <p>
            Обычно это означает, что в Supabase не применены миграции или схема применена не полностью.
            Актуальная миграция восстановления: `20260813134920_expose_data_api_grants.sql`.
          </p>
          <div className="grid gap-2 rounded-md border border-border bg-muted p-3">
            {diagnostics.map((item) => {
              const isOk = item.status === "visible" || item.status === "restricted";
              const Icon = isOk ? CheckCircle2 : XCircle;

              return (
                <div key={item.name} className="grid gap-1 rounded-md bg-panel px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium",
                        isOk ? "text-success" : "text-danger",
                      )}
                    >
                      <Icon aria-hidden className="size-3" />
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    HTTP {item.httpStatus ?? "n/a"} {item.code ?? ""} {item.message}
                  </p>
                </div>
              );
            })}
          </div>
          <FoundationRetryForm />
        </CardContent>
      </Card>
    </main>
  );
}
