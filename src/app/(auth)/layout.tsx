import Link from "next/link";
import type { ReactNode } from "react";
import { Landmark } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  return (
    <main className="grid min-h-dvh bg-background px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 lg:place-items-center lg:px-8 lg:py-8">
      <div className="w-full max-w-6xl lg:grid lg:grid-cols-[0.95fr_0.8fr] lg:items-center lg:gap-20">
        <Link href="/" className="inline-flex items-center gap-2 lg:hidden"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark aria-hidden className="size-5" /></span><span className="text-lg font-semibold">Kapot Money</span></Link>
        <section className="hidden flex-col gap-7 lg:flex"><Link href="/" className="inline-flex w-fit items-center gap-3 text-lg font-semibold"><span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Landmark aria-hidden className="size-5" /></span>Kapot Money</Link><div className="max-w-xl"><p className="text-sm font-semibold uppercase text-primary">Личный финансовый учёт</p><h1 className="mt-3 text-5xl font-bold leading-tight">Деньги видны по источнику, месту и движению.</h1><p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Доходы, кошельки, расходы и переводы хранятся как история движений. Баланс всегда пересчитывается из записей.</p></div>{!configured ? <div className="max-w-xl rounded-[var(--radius-card)] border border-accent/40 bg-accent p-4 text-sm leading-6 text-accent-foreground">Supabase пока не настроен. Заполните <code>.env.local</code> и примените миграции.</div> : null}</section>
        <section className="mt-8 rounded-[var(--radius-card)] border border-border bg-panel p-5 shadow-[var(--shadow-panel)] sm:p-6 lg:mt-0">{children}</section>
      </div>
    </main>
  );
}
