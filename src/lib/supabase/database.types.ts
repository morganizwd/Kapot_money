import type {
  BudgetPeriod,
  CategoryKind,
  DebtKind,
  DebtStatus,
  FinanceBook,
  TransactionKind,
  Wallet,
  WalletType,
} from "@/lib/types";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      user_profiles: Table<{
        id: string;
        display_name: string | null;
        default_currency: string;
        timezone: string;
        locale: string;
        created_at: string;
        updated_at: string;
      }>;
      finance_books: Table<FinanceBook>;
      wallets: Table<Wallet>;
      categories: Table<{
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
      }>;
      transactions: Table<{
        id: string;
        book_id: string;
        kind: TransactionKind;
        category_id: string | null;
        description: string | null;
        note: string | null;
        occurred_at: string;
        reporting_amount_minor: number | null;
        exchange_rate: string | null;
        idempotency_key: string | null;
        created_at: string;
        updated_at: string;
      }>;
      transaction_entries: Table<{
        id: string;
        transaction_id: string;
        wallet_id: string;
        amount_minor: number;
        currency_code: string;
        created_at: string;
      }>;
      budgets: Table<{
        id: string;
        book_id: string;
        category_id: string;
        amount_minor: number;
        currency_code: string;
        period: BudgetPeriod;
        starts_on: string;
        ends_on: string | null;
        created_at: string;
        updated_at: string;
      }>;
      debts: Table<{
        id: string;
        book_id: string;
        kind: DebtKind;
        counterparty_name: string;
        principal_amount_minor: number;
        currency_code: string;
        wallet_id: string | null;
        category_id: string | null;
        due_on: string | null;
        status: DebtStatus;
        note: string | null;
        created_at: string;
        updated_at: string;
      }>;
      debt_payments: Table<{
        id: string;
        debt_id: string;
        transaction_id: string | null;
        amount_minor: number;
        paid_at: string;
        note: string | null;
        created_at: string;
      }>;
      fx_rates: Table<{
        id: string;
        book_id: string;
        base_currency: string;
        quote_currency: string;
        rate: string;
        rated_at: string;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      ensure_user_foundation: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_financial_transaction: {
        Args: {
          p_book_id: string;
          p_kind: TransactionKind;
          p_category_id: string | null;
          p_description: string | null;
          p_note: string | null;
          p_occurred_at: string;
          p_entries: Json;
          p_reporting_amount_minor?: string | null;
          p_exchange_rate?: string | null;
          p_idempotency_key?: string | null;
        };
        Returns: string;
      };
      update_financial_transaction: {
        Args: {
          p_transaction_id: string;
          p_kind: TransactionKind;
          p_category_id: string | null;
          p_description: string | null;
          p_note: string | null;
          p_occurred_at: string;
          p_entries: Json;
          p_reporting_amount_minor?: string | null;
          p_exchange_rate?: string | null;
        };
        Returns: string;
      };
      delete_financial_transaction: {
        Args: {
          p_transaction_id: string;
        };
        Returns: undefined;
      };
      get_wallet_balances: {
        Args: {
          p_book_id: string;
        };
        Returns: Array<Wallet & { current_balance_minor: number }>;
      };
      get_period_summary: {
        Args: {
          p_book_id: string;
          p_from: string;
          p_to: string;
        };
        Returns: Array<{
          income_minor: number;
          expense_minor: number;
          cash_flow_minor: number;
        }>;
      };
      get_budget_progress: {
        Args: {
          p_book_id: string;
          p_on: string;
        };
        Returns: Array<{
          budget_id: string;
          category_id: string;
          category_name: string;
          amount_minor: number;
          currency_code: string;
          period: BudgetPeriod;
          spent_minor: number;
          remaining_minor: number;
          progress_percent: number;
        }>;
      };
      get_category_report: {
        Args: {
          p_book_id: string;
          p_from: string;
          p_to: string;
          p_kind: CategoryKind;
        };
        Returns: Array<{
          category_id: string;
          category_name: string;
          kind: CategoryKind;
          amount_minor: number;
        }>;
      };
    };
    Enums: {
      wallet_type: WalletType;
      category_kind: CategoryKind;
      transaction_kind: TransactionKind;
      budget_period: BudgetPeriod;
      debt_kind: DebtKind;
      debt_status: DebtStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
