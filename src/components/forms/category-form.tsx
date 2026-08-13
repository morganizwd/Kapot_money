"use client";

import { useActionState, useMemo, useState } from "react";
import { FolderPlus } from "lucide-react";
import { categoryIconOptions } from "@/components/app/category-icon";
import { createCategoryAction } from "@/app/app/actions";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { idleActionState, type Category, type FinanceBook } from "@/lib/types";

export function CategoryForm({ book, categories }: { book: FinanceBook; categories: Category[] }) {
  const [state, action] = useActionState(createCategoryAction, idleActionState);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState("tag");
  const parentOptions = useMemo(() => categories.filter((category) => category.kind === kind && !category.parent_id), [categories, kind]);

  return <form action={action} className="grid gap-4"><input type="hidden" name="bookId" value={book.id} /><input type="hidden" name="icon" value={icon} /><FormStatus state={state} /><div className="grid gap-2"><Label htmlFor="category-name">Название</Label><Input id="category-name" name="name" placeholder="Например, Продукты" required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="category-kind">Тип</Label><Select id="category-kind" name="kind" value={kind} onChange={(event) => setKind(event.target.value as "income" | "expense")}><option value="expense">Расход</option><option value="income">Доход</option></Select></div><div className="grid gap-2"><Label htmlFor="category-parent">Родительская категория</Label><Select id="category-parent" name="parentId" defaultValue=""><option value="">Без родителя</option>{parentOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div></div><fieldset><legend className="text-sm font-medium leading-6 text-foreground">Иконка</legend><div className="mt-2 grid grid-cols-6 gap-2">{categoryIconOptions.map((option) => { const Icon = option.icon; return <button key={option.id} type="button" onClick={() => setIcon(option.id)} aria-label={option.label} aria-pressed={icon === option.id} className={cn("grid size-11 place-items-center rounded-[var(--radius-control)] border transition active:scale-95", icon === option.id ? "border-primary bg-accent text-primary" : "border-border bg-panel text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon aria-hidden className="size-5" /></button>; })}</div></fieldset><SubmitButton pendingLabel="Создаём" className="w-full"><FolderPlus aria-hidden className="size-5" />Создать категорию</SubmitButton></form>;
}
