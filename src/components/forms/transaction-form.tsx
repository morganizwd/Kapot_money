"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarDays, ChevronDown, Save, WalletCards } from "lucide-react";
import { createTransactionAction, updateTransactionAction } from "@/app/app/actions";
import { CategoryIcon } from "@/components/app/category-icon";
import { BottomSheet, MobileFormRow, SelectionRow } from "@/components/app/mobile-ui";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { OperationIntent } from "@/lib/finance/drag-drop";
import { idleActionState, type Category, type FinanceBook, type TransactionKind, type WalletBalance } from "@/lib/types";

type EditableTransaction = {
  id: string;
  kind: TransactionKind;
  categoryId: string | null;
  description: string;
  note: string;
  occurredAt: string;
  sourceWalletId: string | null;
  destinationWalletId: string | null;
  amount: string;
  receivedAmount: string;
};

type Selector = "source" | "destination" | "category" | null;

export function TransactionForm({
  book,
  wallets,
  categories,
  compact = false,
  initial,
  initialKind,
  intent,
  presentation = "default",
  onSuccess,
}: {
  book: FinanceBook;
  wallets: WalletBalance[];
  categories: Category[];
  compact?: boolean;
  initial?: EditableTransaction;
  initialKind?: TransactionKind;
  intent?: OperationIntent;
  presentation?: "default" | "sheet";
  onSuccess?: () => void;
}) {
  const action = initial ? updateTransactionAction : createTransactionAction;
  const [state, formAction] = useActionState(action, idleActionState);
  const [kind, setKind] = useState<TransactionKind>(initial?.kind ?? intent?.kind ?? initialKind ?? "expense");
  const activeWallets = wallets.filter((wallet) => !wallet.is_archived);
  const firstWallet = activeWallets[0];
  const secondWallet = activeWallets[1] ?? activeWallets[0];
  const preferredWalletId = typeof window !== "undefined" && presentation === "sheet" && !initial ? localStorage.getItem("kapot-last-wallet") : null;
  const defaultWalletId = preferredWalletId && activeWallets.some((wallet) => wallet.id === preferredWalletId) ? preferredWalletId : firstWallet?.id ?? "";
  const [sourceWalletId, setSourceWalletId] = useState(initial?.sourceWalletId ?? (intent?.kind === "expense" ? intent.walletId : intent?.kind === "transfer" ? intent.sourceWalletId : defaultWalletId));
  const [destinationWalletId, setDestinationWalletId] = useState(initial?.destinationWalletId ?? (intent?.kind === "income" ? intent.walletId : intent?.kind === "transfer" ? intent.destinationWalletId : preferredWalletId && activeWallets.some((wallet) => wallet.id === preferredWalletId) ? preferredWalletId : secondWallet?.id ?? ""));
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? (intent?.kind === "income" || intent?.kind === "expense" ? intent.categoryId : ""));
  const [selector, setSelector] = useState<Selector>(null);
  const successMessage = useRef<string | null>(null);

  useEffect(() => {
    if (state.status !== "success" || !state.message || successMessage.current === state.message) return;
    successMessage.current = state.message;
    const lastWallet = kind === "income" ? destinationWalletId : sourceWalletId;
    if (lastWallet) localStorage.setItem("kapot-last-wallet", lastWallet);
    onSuccess?.();
  }, [destinationWalletId, kind, onSuccess, sourceWalletId, state.message, state.status]);

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.kind === kind && !category.is_archived),
    [categories, kind],
  );
  const sourceWallet = activeWallets.find((wallet) => wallet.id === sourceWalletId) ?? firstWallet;
  const destinationWallet = activeWallets.find((wallet) => wallet.id === destinationWalletId) ?? firstWallet;
  const selectedCategory = categoryOptions.find((category) => category.id === categoryId);
  const currencyCode = kind === "income" ? destinationWallet?.currency_code : sourceWallet?.currency_code;
  const destinationCurrencyCode = destinationWallet?.currency_code ?? currencyCode ?? book.base_currency;
  const isSheet = presentation === "sheet";

  function changeKind(nextKind: TransactionKind) {
    setKind(nextKind);
    setCategoryId("");
  }

  return (
    <>
      <form action={formAction} className={cn("grid gap-4", isSheet && "gap-5 pb-1")}>
        <input type="hidden" name="bookId" value={book.id} />
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="currencyCode" value={currencyCode ?? book.base_currency} />
        <input type="hidden" name="destinationCurrencyCode" value={destinationCurrencyCode} />
        <input type="hidden" name="sourceWalletId" value={sourceWalletId} />
        <input type="hidden" name="destinationWalletId" value={destinationWalletId} />
        <input type="hidden" name="categoryId" value={categoryId} />
        {initial ? <input type="hidden" name="transactionId" value={initial.id} /> : null}
        <FormStatus state={state} />

        {!initial && !intent ? <ModeChooser kind={kind} onChange={changeKind} sheet={isSheet} /> : null}

        {isSheet ? (
          <div className="rounded-[var(--radius-card)] bg-muted px-4 py-5 text-center">
            <Label className="sr-only" htmlFor="amount">Сумма</Label>
            <div className="flex items-baseline justify-center gap-2">
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                autoFocus
                placeholder="0,00"
                defaultValue={initial?.amount}
                required
                className="h-auto min-w-0 border-0 bg-transparent px-0 text-center text-[2.5rem] font-bold leading-none shadow-none outline-none placeholder:text-muted-foreground/45 focus:border-0"
              />
              <span className="shrink-0 text-base font-semibold text-muted-foreground">{currencyCode ?? book.base_currency}</span>
            </div>
            {kind === "transfer" ? <p className="mt-2 text-sm text-muted-foreground">Сумма списания</p> : null}
          </div>
        ) : null}

        {isSheet && intent ? <IntentFlow kind={kind} sourceWallet={sourceWallet} destinationWallet={destinationWallet} category={selectedCategory} /> : null}

        {isSheet ? (
          <div className="grid gap-3">
            {kind !== "income" ? (
              <MobileFormRow label={kind === "transfer" ? "Откуда" : "С кошелька"} value={sourceWallet ? `${sourceWallet.name} · ${sourceWallet.currency_code}` : "Выберите кошелёк"} icon={<WalletCards aria-hidden className="size-5" />} onClick={() => setSelector("source")} />
            ) : null}
            {kind !== "expense" ? (
              <MobileFormRow label={kind === "transfer" ? "Куда" : "В кошелёк"} value={destinationWallet ? `${destinationWallet.name} · ${destinationWallet.currency_code}` : "Выберите кошелёк"} icon={<WalletCards aria-hidden className="size-5" />} onClick={() => setSelector("destination")} />
            ) : null}
            {kind === "transfer" ? <Button type="button" variant="ghost" onClick={() => { const currentSource = sourceWalletId; setSourceWalletId(destinationWalletId); setDestinationWalletId(currentSource); }} className="h-10 self-center text-sm text-primary"><ArrowLeftRight aria-hidden className="size-4" />Поменять местами</Button> : null}
            {kind !== "transfer" && kind !== "adjustment" ? (
              <MobileFormRow label={kind === "income" ? "Источник" : "Категория"} value={selectedCategory?.name ?? "Выберите категорию"} icon={selectedCategory ? <CategoryIcon name={selectedCategory.name} icon={selectedCategory.icon} /> : <ChevronDown aria-hidden className="size-5" />} onClick={() => setSelector("category")} />
            ) : null}
          </div>
        ) : (
          <DesktopFields
            kind={kind}
            activeWallets={activeWallets}
            categoryOptions={categoryOptions}
            sourceWalletId={sourceWalletId}
            destinationWalletId={destinationWalletId}
            categoryId={categoryId}
            onSourceWalletChange={setSourceWalletId}
            onDestinationWalletChange={setDestinationWalletId}
            onCategoryChange={setCategoryId}
            initial={initial}
            compact={compact}
          />
        )}

        {isSheet && kind !== "transfer" && kind !== "adjustment" && categoryOptions.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Частые категории</p>
              <button type="button" onClick={() => setSelector("category")} className="text-sm font-semibold text-primary">Все</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {categoryOptions.slice(0, 8).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={cn(
                    "flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-control)] px-1.5 text-center text-xs font-medium transition active:scale-[0.98]",
                    categoryId === category.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent",
                  )}
                >
                  <CategoryIcon name={category.name} icon={category.icon} className="size-5" />
                  <span className="line-clamp-2">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {kind === "transfer" && isSheet ? (
          <div className="grid gap-2">
            <Label htmlFor="receivedAmount">Получаю</Label>
            <Input id="receivedAmount" name="receivedAmount" inputMode="decimal" placeholder="Та же сумма" defaultValue={initial?.receivedAmount} />
          </div>
        ) : null}

        <details className={cn("rounded-[var(--radius-control)] border border-border p-3.5", isSheet && "bg-panel")}>
          <summary className="cursor-pointer list-none text-sm font-semibold text-muted-foreground">Дополнительно</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="occurredAt">Дата</Label>
              <Input id="occurredAt" name="occurredAt" type="date" defaultValue={initial?.occurredAt ?? new Date().toISOString().slice(0, 10)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Input id="description" name="description" defaultValue={initial?.description} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="note">Заметка</Label>
              <Textarea id="note" name="note" defaultValue={initial?.note} />
            </div>
          </div>
        </details>

        {!isSheet ? (
          <SubmitButton pendingLabel="Сохраняем" className="w-full sm:w-auto">
            <Save aria-hidden className="size-4" />
            {initial ? "Сохранить изменения" : "Сохранить"}
          </SubmitButton>
        ) : (
          <SubmitButton pendingLabel="Сохраняем" className="sticky bottom-0 z-10 h-14 w-full shadow-[0_-12px_20px_var(--panel)]">
            <Save aria-hidden className="size-5" />
            {kind === "expense" ? "Добавить расход" : kind === "income" ? "Добавить доход" : kind === "transfer" ? "Выполнить перевод" : "Сохранить корректировку"}
          </SubmitButton>
        )}
      </form>

      {selector === "source" || selector === "destination" ? (
        <BottomSheet title="Выберите кошелёк" onClose={() => setSelector(null)}>
          <div className="divide-y divide-border">
            {activeWallets.map((wallet) => {
              const selected = selector === "source" ? wallet.id === sourceWalletId : wallet.id === destinationWalletId;
              return <SelectionRow key={wallet.id} title={wallet.name} subtitle={`${wallet.currency_code} · ${wallet.current_balance_minor}`} selected={selected} icon={<WalletCards aria-hidden className="size-5" />} onClick={() => { if (selector === "source") setSourceWalletId(wallet.id); else setDestinationWalletId(wallet.id); setSelector(null); }} />;
            })}
          </div>
        </BottomSheet>
      ) : null}
      {selector === "category" ? (
        <BottomSheet title={kind === "income" ? "Источник дохода" : "Категория"} onClose={() => setSelector(null)}>
          <div className="divide-y divide-border">
            {categoryOptions.map((category) => (
              <SelectionRow key={category.id} title={category.name} selected={category.id === categoryId} icon={<CategoryIcon name={category.name} icon={category.icon} />} onClick={() => { setCategoryId(category.id); setSelector(null); }} />
            ))}
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}

function IntentFlow({ kind, sourceWallet, destinationWallet, category }: { kind: TransactionKind; sourceWallet: WalletBalance | undefined; destinationWallet: WalletBalance | undefined; category: Category | undefined }) {
  const start = kind === "income" ? category?.name : sourceWallet?.name;
  const end = kind === "income" ? destinationWallet?.name : kind === "expense" ? category?.name : destinationWallet?.name;
  const startIcon = kind === "income" && category ? <CategoryIcon name={category.name} icon={category.icon} /> : <WalletCards aria-hidden className="size-4" />;
  const endIcon = kind === "expense" && category ? <CategoryIcon name={category.name} icon={category.icon} /> : <WalletCards aria-hidden className="size-4" />;

  return <div className="flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-panel px-3 py-2.5 text-sm"><span className="inline-flex min-w-0 items-center gap-1.5 font-semibold"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-primary">{startIcon}</span><span className="truncate">{start ?? "Кошелёк"}</span></span><ArrowDown aria-hidden className="size-4 shrink-0 text-primary" /><span className="inline-flex min-w-0 items-center gap-1.5 font-semibold"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-primary">{endIcon}</span><span className="truncate">{end ?? "Кошелёк"}</span></span></div>;
}

function DesktopFields({
  kind,
  activeWallets,
  categoryOptions,
  sourceWalletId,
  destinationWalletId,
  categoryId,
  onSourceWalletChange,
  onDestinationWalletChange,
  onCategoryChange,
  initial,
  compact,
}: {
  kind: TransactionKind;
  activeWallets: WalletBalance[];
  categoryOptions: Category[];
  sourceWalletId: string;
  destinationWalletId: string;
  categoryId: string;
  onSourceWalletChange: (value: string) => void;
  onDestinationWalletChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  initial?: EditableTransaction;
  compact: boolean;
}) {
  return (
    <div className={cn("grid gap-3", compact ? "lg:grid-cols-2" : "md:grid-cols-2")}>
      {kind !== "income" ? <SelectField id="sourceWalletId" label="Кошелёк списания" name="sourceWalletId" value={sourceWalletId} onChange={onSourceWalletChange} options={activeWallets.map((wallet) => ({ value: wallet.id, label: `${wallet.name} · ${wallet.currency_code}` }))} /> : null}
      {kind !== "expense" ? <SelectField id="destinationWalletId" label="Кошелёк поступления" name="destinationWalletId" value={destinationWalletId} onChange={onDestinationWalletChange} options={activeWallets.map((wallet) => ({ value: wallet.id, label: `${wallet.name} · ${wallet.currency_code}` }))} /> : null}
      {kind !== "transfer" && kind !== "adjustment" ? <SelectField id="categoryId" label="Категория" name="categoryId" value={categoryId} onChange={onCategoryChange} options={categoryOptions.map((category) => ({ value: category.id, label: category.name }))} emptyLabel="Выберите категорию" /> : null}
      <div className="grid gap-2">
        <Label htmlFor="amount">{kind === "transfer" ? "Отдано" : "Сумма"}</Label>
        <Input id="amount" name="amount" inputMode="decimal" placeholder="120" defaultValue={initial?.amount} required />
      </div>
      {kind === "transfer" ? <div className="grid gap-2"><Label htmlFor="receivedAmount">Получено</Label><Input id="receivedAmount" name="receivedAmount" inputMode="decimal" placeholder="300" defaultValue={initial?.receivedAmount} /></div> : null}
    </div>
  );
}

function SelectField({ id, label, name, value, onChange, options, emptyLabel }: { id: string; label: string; name: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; emptyLabel?: string }) {
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Select id={id} name={name} value={value} onChange={(event) => onChange(event.target.value)} required><option value="" disabled>{emptyLabel ?? "Выберите"}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></div>;
}

function ModeChooser({ kind, onChange, sheet }: { kind: TransactionKind; onChange: (kind: TransactionKind) => void; sheet: boolean }) {
  const modes: Array<{ value: TransactionKind; label: string; icon: typeof ArrowDownLeft; tone: string }> = [
    { value: "expense", label: "Расход", icon: ArrowDownLeft, tone: "text-danger" },
    { value: "income", label: "Доход", icon: ArrowUpRight, tone: "text-success" },
    { value: "transfer", label: "Перевод", icon: ArrowLeftRight, tone: "text-secondary" },
    ...(sheet ? [{ value: "adjustment" as TransactionKind, label: "Корректировка", icon: CalendarDays, tone: "text-muted-foreground" }] : []),
  ];

  return (
    <div className={cn("grid gap-2", sheet ? "grid-cols-4" : "grid-cols-3") } role="group" aria-label="Тип операции">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return <Button key={mode.value} type="button" variant={kind === mode.value ? "primary" : "outline"} onClick={() => onChange(mode.value)} className={cn("min-w-0 px-2", sheet ? "h-16 flex-col gap-1 text-xs" : "h-12", kind === mode.value ? "" : "bg-panel")}><Icon aria-hidden className={cn("size-4", kind === mode.value ? "" : mode.tone)} /><span className="truncate">{mode.label}</span></Button>;
      })}
    </div>
  );
}
