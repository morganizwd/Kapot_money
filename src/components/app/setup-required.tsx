import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle aria-hidden className="size-5 text-accent" />
            Требуется настройка Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
          <p>
            Приложение не использует моковую авторизацию или локальные финансы. Для запуска
            заполните `.env.local` по `.env.example`, создайте Supabase project и примените
            миграции из `supabase/migrations`.
          </p>
          <p>
            После этого регистрация, RLS, операции, бюджеты и отчеты будут работать с реальной
            PostgreSQL базой.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
