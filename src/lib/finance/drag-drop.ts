export type DragEntityType = "income-category" | "wallet" | "expense-category";

export type DragEntity = {
  id: string;
  type: DragEntityType;
  name: string;
  icon?: string | null;
  currencyCode?: string;
  balanceMinor?: number;
};

export type OperationIntent =
  | { kind: "income"; categoryId: string; walletId: string }
  | { kind: "expense"; walletId: string; categoryId: string }
  | { kind: "transfer"; sourceWalletId: string; destinationWalletId: string };

export function resolveDropAction(source: DragEntity, target: DragEntity): OperationIntent | null {
  if (source.type === "income-category" && target.type === "wallet") {
    return { kind: "income", categoryId: source.id, walletId: target.id };
  }

  if (source.type === "wallet" && target.type === "expense-category") {
    return { kind: "expense", walletId: source.id, categoryId: target.id };
  }

  if (source.type === "wallet" && target.type === "wallet" && source.id !== target.id) {
    return { kind: "transfer", sourceWalletId: source.id, destinationWalletId: target.id };
  }

  return null;
}

export function isAllowedDropTarget(source: DragEntity | null, target: DragEntity) {
  return source ? resolveDropAction(source, target) !== null : false;
}

export function getDropHint(source: DragEntity | null, target: DragEntity | null) {
  if (!source) return "Удерживайте объект и перетащите деньги между сущностями";

  if (target) {
    const intent = resolveDropAction(source, target);
    if (intent?.kind === "expense") return "Отпустите, чтобы добавить расход";
    if (intent?.kind === "income") return "Отпустите, чтобы добавить доход";
    if (intent?.kind === "transfer") return "Отпустите, чтобы перевести деньги";
    if (source.type === "wallet" && target.type === "wallet" && source.id === target.id) return "Нельзя перевести деньги в тот же кошелёк";
  }

  return source.type === "income-category"
    ? "Перетащите источник дохода на кошелёк"
    : "Перетащите кошелёк на категорию расхода или другой кошелёк";
}
