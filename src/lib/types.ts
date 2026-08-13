export type CurrencyCode = string;

export type WalletType =
  | "cash"
  | "bank_card"
  | "bank_account"
  | "savings"
  | "deposit"
  | "ewallet"
  | "credit"
  | "receivable"
  | "liability"
  | "other";

export type CategoryKind = "income" | "expense";
export type TransactionKind = "income" | "expense" | "transfer" | "adjustment";
export type BudgetPeriod = "monthly" | "yearly" | "custom";
export type DebtKind = "receivable" | "payable";
export type DebtStatus = "open" | "settled" | "archived";

export type FinanceBook = {
  id: string;
  owner_id: string;
  name: string;
  base_currency: CurrencyCode;
  icon: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Wallet = {
  id: string;
  book_id: string;
  name: string;
  type: WalletType;
  currency_code: CurrencyCode;
  opening_balance_minor: number;
  opening_balance_date: string;
  icon: string | null;
  sort_order: number;
  include_in_net_worth: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type WalletBalance = Wallet & {
  current_balance_minor: number;
};

export type Category = {
  id: string;
  book_id: string;
  name: string;
  kind: CategoryKind;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TransactionEntry = {
  id: string;
  transaction_id: string;
  wallet_id: string;
  amount_minor: number;
  currency_code: CurrencyCode;
  created_at: string;
};

export type TransactionListItem = {
  id: string;
  book_id: string;
  kind: TransactionKind;
  category_id: string | null;
  description: string | null;
  note: string | null;
  occurred_at: string;
  reporting_amount_minor: number | null;
  exchange_rate: string | null;
  created_at: string;
  updated_at: string;
  categories: Pick<Category, "id" | "name" | "kind" | "parent_id" | "icon"> | null;
  transaction_entries: Array<
    Pick<TransactionEntry, "id" | "wallet_id" | "amount_minor" | "currency_code"> & {
      wallets: Pick<Wallet, "id" | "name" | "currency_code"> | null;
    }
  >;
};

export type BudgetProgress = {
  budget_id: string;
  category_id: string;
  category_name: string;
  amount_minor: number;
  currency_code: CurrencyCode;
  period: BudgetPeriod;
  spent_minor: number;
  remaining_minor: number;
  progress_percent: number;
};

export type PeriodSummary = {
  income_minor: number;
  expense_minor: number;
  cash_flow_minor: number;
};

export type CategoryReportRow = {
  category_id: string;
  category_name: string;
  kind: CategoryKind;
  amount_minor: number;
};

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const idleActionState: ActionState = {
  status: "idle",
  message: "",
};
