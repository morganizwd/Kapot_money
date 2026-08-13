"use client";

import { useState } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BottomSheet } from "@/components/app/mobile-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Category, WalletBalance } from "@/lib/types";

export function TransactionFilters({ wallets, categories, count }: { wallets: WalletBalance[]; categories: Category[]; count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(searchParams.get("kind") ?? "all");
  const [walletId, setWalletId] = useState(searchParams.get("walletId") ?? "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "");

  function navigate(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`);
  }

  function resetFilters() {
    setKind("all");
    setWalletId("");
    setCategoryId("");
    navigate({ kind: "", walletId: "", categoryId: "" });
    setOpen(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <form className="relative min-w-0 flex-1" onSubmit={(event) => { event.preventDefault(); navigate({ search: new FormData(event.currentTarget).get("search")?.toString() ?? "" }); }}>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input name="search" defaultValue={searchParams.get("search") ?? ""} placeholder="Поиск операций" className="pl-11" aria-label="Поиск операций" />
        </form>
        <Button type="button" variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Фильтры"><Filter aria-hidden className="size-5" /></Button>
      </div>
      {open ? <BottomSheet title="Фильтры" onClose={() => setOpen(false)} footer={<div className="grid grid-cols-2 gap-3"><Button variant="ghost" onClick={resetFilters}>Сбросить</Button><Button onClick={() => { navigate({ kind: kind === "all" ? "" : kind, walletId, categoryId }); setOpen(false); }}>Показать {count}</Button></div>}><div className="grid gap-5"><div className="grid gap-2"><Label htmlFor="filter-kind">Тип</Label><Select id="filter-kind" value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">Все операции</option><option value="income">Доходы</option><option value="expense">Расходы</option><option value="transfer">Переводы</option><option value="adjustment">Корректировки</option></Select></div><div className="grid gap-2"><Label htmlFor="filter-wallet">Кошелёк</Label><Select id="filter-wallet" value={walletId} onChange={(event) => setWalletId(event.target.value)}><option value="">Все кошельки</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</Select></div><div className="grid gap-2"><Label htmlFor="filter-category">Категория</Label><Select id="filter-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Все категории</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div><div className="flex items-center gap-3 rounded-[var(--radius-control)] bg-muted p-3 text-sm text-muted-foreground"><SlidersHorizontal aria-hidden className="size-5 text-primary" />Период и сумма появятся здесь, когда будут добавлены в запрос истории.</div></div></BottomSheet> : null}
    </>
  );
}
