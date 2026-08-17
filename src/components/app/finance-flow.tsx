"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ArrowDown, GripVertical, Plus, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/app/category-icon";
import { BottomSheet, MoneyAmount, SectionHeader } from "@/components/app/mobile-ui";
import { QuickTransactionSheet } from "@/components/app/quick-transaction-sheet";
import { CategoryForm } from "@/components/forms/category-form";
import { cn } from "@/lib/utils";
import { getDropHint, isAllowedDropTarget, resolveDropAction, type DragEntity, type OperationIntent } from "@/lib/finance/drag-drop";
import type { Category, FinanceBook, WalletBalance } from "@/lib/types";

type EntityData = { entity: DragEntity };

export function FinanceFlow({ book, wallets, categories }: { book: FinanceBook; wallets: WalletBalance[]; categories: Category[] }) {
  const activeWallets = wallets.filter((wallet) => !wallet.is_archived);
  const incomeCategories = categories.filter((category) => category.kind === "income" && !category.is_archived);
  const expenseCategories = categories.filter((category) => category.kind === "expense" && !category.is_archived);
  const [activeEntity, setActiveEntity] = useState<DragEntity | null>(null);
  const [overEntity, setOverEntity] = useState<DragEntity | null>(null);
  const [intent, setIntent] = useState<OperationIntent | null>(null);
  const [newCategoryKind, setNewCategoryKind] = useState<"income" | "expense" | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const walletsById = useMemo(() => new Map(activeWallets.map((wallet) => [wallet.id, wallet])), [activeWallets]);

  function getEntity(data: unknown) {
    return (data as EntityData | undefined)?.entity ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    const entity = getEntity(event.active.data.current);
    setActiveEntity(entity);
    setOverEntity(null);
    navigator.vibrate?.(10);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverEntity(getEntity(event.over?.data.current));
  }

  function resetDrag() {
    setActiveEntity(null);
    setOverEntity(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const source = getEntity(event.active.data.current);
    const target = getEntity(event.over?.data.current);
    const nextIntent = source && target ? resolveDropAction(source, target) : null;
    resetDrag();

    if (!source || !target) return;
    if (!nextIntent) {
      if (source.type === "wallet" && target.type === "wallet" && source.id === target.id) {
        toast.error("Нельзя перевести деньги в тот же кошелёк.");
      }
      return;
    }

    navigator.vibrate?.(15);
    window.setTimeout(() => setIntent(nextIntent), 120);
  }

  function openTapIntent(nextIntent: OperationIntent) {
    setIntent(nextIntent);
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <DndContext id="finance-flow" sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={resetDrag} autoScroll>
        <section className="min-w-0 max-w-full rounded-[var(--radius-card)] border border-border bg-panel p-4 shadow-[var(--shadow-panel)] sm:p-5">
          <SectionHeader title="Движение денег" />
          <p className="mt-1 text-sm leading-5 text-muted-foreground" aria-live="polite">{getDropHint(activeEntity, overEntity)}</p>
          <div className="mt-5 grid gap-5">
            <FlowGroup title="Доходы" description="Перетащите на кошелёк">
              <div className="grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-4">{incomeCategories.map((category) => <IncomeCategoryCard key={category.id} category={category} isDragging={activeEntity?.id === category.id && activeEntity.type === "income-category"} onTap={() => activeWallets[0] && openTapIntent({ kind: "income", categoryId: category.id, walletId: activeWallets[0].id })} />)}<AddCategoryCard kind="income" onClick={() => setNewCategoryKind("income")} /></div>
            </FlowGroup>

            <FlowGroup title="Кошельки" description="На расход или другой кошелёк">
              {activeWallets.length === 0 ? <FlowEmpty>Добавьте кошелёк, чтобы начать</FlowEmpty> : <div className="grid gap-2 sm:grid-cols-2">{activeWallets.map((wallet) => <WalletFlowCard key={wallet.id} wallet={wallet} source={activeEntity} isOver={overEntity?.id === wallet.id && overEntity.type === "wallet"} onTap={() => toast.message("Удерживайте кошелёк и перетащите его на расход или другой кошелёк.")} />)}</div>}
            </FlowGroup>

            <FlowGroup title="Расходы" description="Перетащите сюда кошелёк">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{expenseCategories.map((category) => <ExpenseCategoryCard key={category.id} category={category} source={activeEntity} isOver={overEntity?.id === category.id && overEntity.type === "expense-category"} onTap={() => activeWallets[0] && openTapIntent({ kind: "expense", walletId: activeWallets[0].id, categoryId: category.id })} />)}<AddCategoryCard kind="expense" onClick={() => setNewCategoryKind("expense")} /></div>
            </FlowGroup>
          </div>
        </section>
        <DragOverlay dropAnimation={null}>{activeEntity ? <FinanceDragOverlay entity={activeEntity} wallet={walletsById.get(activeEntity.id)} /> : null}</DragOverlay>
      </DndContext>
      {intent ? <QuickTransactionSheet book={book} wallets={activeWallets} categories={categories} intent={intent} onClose={() => setIntent(null)} /> : null}
      {newCategoryKind ? <BottomSheet title={newCategoryKind === "income" ? "Новая категория дохода" : "Новая категория расхода"} onClose={() => setNewCategoryKind(null)}><CategoryForm book={book} categories={categories} defaultKind={newCategoryKind} onSuccess={() => setNewCategoryKind(null)} /></BottomSheet> : null}
    </div>
  );
}

function FlowGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="min-w-0"><div className="mb-2 flex min-w-0 items-center justify-between gap-3"><h3 className="text-sm font-semibold">{title}</h3><span className="min-w-0 truncate text-right text-xs text-muted-foreground">{description}</span></div>{children}</div>;
}

function FlowEmpty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[var(--radius-control)] border border-dashed border-border bg-muted px-3 py-4 text-center text-sm text-muted-foreground">{children}</div>;
}

function AddCategoryCard({ kind, onClick }: { kind: "income" | "expense"; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("flex min-h-[84px] min-w-0 flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] border border-dashed px-2 text-center text-xs font-semibold transition hover:bg-muted active:scale-[0.98]", kind === "income" ? "border-success/40 text-success" : "border-primary/40 text-primary")}><span className="grid size-9 place-items-center rounded-xl bg-panel shadow-sm"><Plus aria-hidden className="size-5" /></span><span className="line-clamp-2">Добавить категорию</span></button>;
}

function IncomeCategoryCard({ category, isDragging, onTap }: { category: Category; isDragging: boolean; onTap: () => void }) {
  const entity: DragEntity = { id: category.id, type: "income-category", name: category.name, icon: category.icon };
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `income:${category.id}`, data: { entity } });
  return <button ref={setNodeRef} type="button" onClick={onTap} className={cn("relative flex min-h-[84px] min-w-0 flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] bg-success/10 px-2 text-center text-sm font-semibold text-success transition", isDragging && "opacity-45")} {...attributes} {...listeners}><span className="grid size-9 place-items-center rounded-xl bg-panel"><CategoryIcon name={category.name} icon={category.icon} /></span><span className="line-clamp-2">{category.name}</span></button>;
}

function WalletFlowCard({ wallet, source, isOver, onTap }: { wallet: WalletBalance; source: DragEntity | null; isOver: boolean; onTap: () => void }) {
  const entity: DragEntity = { id: wallet.id, type: "wallet", name: wallet.name, icon: wallet.icon, currencyCode: wallet.currency_code, balanceMinor: wallet.current_balance_minor };
  const draggable = useDraggable({ id: `wallet-drag:${wallet.id}`, data: { entity } });
  const droppable = useDroppable({ id: `wallet-drop:${wallet.id}`, data: { entity } });
  const isValid = isAllowedDropTarget(source, entity);
  const isDragging = source?.id === wallet.id && source.type === "wallet";
  const setNodeRef = (node: HTMLElement | null) => { draggable.setNodeRef(node); droppable.setNodeRef(node); };

  return <button ref={setNodeRef} type="button" onClick={onTap} className={cn("relative flex min-h-[76px] min-w-0 w-full items-center gap-3 rounded-[var(--radius-control)] border bg-panel px-3 text-left shadow-sm transition", isValid ? "border-primary bg-accent/45" : "border-border", isOver && isValid && "scale-[1.02] border-2 bg-accent", isDragging && "opacity-45")} {...draggable.attributes} {...draggable.listeners}><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary"><WalletCards aria-hidden className="size-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{wallet.name}</span><span className="mt-1 block min-w-0 overflow-hidden"><MoneyAmount amountMinor={wallet.current_balance_minor} currencyCode={wallet.currency_code} className="text-base font-bold" /></span></span><GripVertical aria-hidden className="size-4 shrink-0 text-muted-foreground/60" />{isOver && isValid ? <span className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">{source?.type === "income-category" ? "Добавить доход" : "Перевести"}</span> : null}</button>;
}

function ExpenseCategoryCard({ category, source, isOver, onTap }: { category: Category; source: DragEntity | null; isOver: boolean; onTap: () => void }) {
  const entity: DragEntity = { id: category.id, type: "expense-category", name: category.name, icon: category.icon };
  const { setNodeRef } = useDroppable({ id: `expense:${category.id}`, data: { entity } });
  const isValid = isAllowedDropTarget(source, entity);
  return <button ref={setNodeRef} type="button" onClick={onTap} className={cn("relative flex min-h-[84px] min-w-0 flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] border px-2 text-center text-sm font-semibold transition", isValid ? "border-primary bg-accent/45 text-accent-foreground" : "border-transparent bg-muted", isOver && isValid && "scale-[1.03] border-2 bg-accent", source?.type === "income-category" && "opacity-55")}><span className="grid size-9 place-items-center rounded-xl bg-panel text-primary"><CategoryIcon name={category.name} icon={category.icon} /></span><span className="line-clamp-2">{isOver && isValid ? "Добавить расход" : category.name}</span></button>;
}

function FinanceDragOverlay({ entity, wallet }: { entity: DragEntity; wallet?: WalletBalance }) {
  const isWallet = entity.type === "wallet";
  return <div className="flex min-h-16 min-w-40 items-center gap-3 rounded-[var(--radius-control)] border border-border bg-panel px-3 shadow-[0_16px_40px_rgb(18_20_23_/_0.22)]"><span className={cn("grid size-10 place-items-center rounded-xl", isWallet ? "bg-secondary/10 text-secondary" : entity.type === "income-category" ? "bg-success/10 text-success" : "bg-accent text-primary")} >{isWallet ? <WalletCards aria-hidden className="size-5" /> : <CategoryIcon name={entity.name} icon={entity.icon} />}</span><span><span className="block max-w-36 truncate text-sm font-semibold">{entity.name}</span>{wallet ? <MoneyAmount amountMinor={wallet.current_balance_minor} currencyCode={wallet.currency_code} className="mt-0.5 text-xs font-semibold" /> : <span className="mt-0.5 block text-xs text-muted-foreground">{entity.type === "income-category" ? "Источник дохода" : "Категория расхода"}</span>}</span><ArrowDown aria-hidden className="size-4 text-primary" /></div>;
}
