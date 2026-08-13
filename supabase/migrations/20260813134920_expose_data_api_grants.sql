grant usage on schema public to anon, authenticated, service_role;

grant select on table
  public.user_profiles,
  public.finance_books,
  public.wallets,
  public.categories,
  public.transactions,
  public.transaction_entries,
  public.budgets,
  public.debts,
  public.debt_payments,
  public.fx_rates
to anon;

grant select, insert, update, delete on table
  public.user_profiles,
  public.finance_books,
  public.wallets,
  public.categories,
  public.transactions,
  public.transaction_entries,
  public.budgets,
  public.debts,
  public.debt_payments,
  public.fx_rates
to authenticated;

grant all privileges on table
  public.user_profiles,
  public.finance_books,
  public.wallets,
  public.categories,
  public.transactions,
  public.transaction_entries,
  public.budgets,
  public.debts,
  public.debt_payments,
  public.fx_rates
to service_role;

alter policy "Users manage own profile" on public.user_profiles to authenticated;
alter policy "Users manage own finance books" on public.finance_books to authenticated;
alter policy "Users manage wallets in own books" on public.wallets to authenticated;
alter policy "Users manage categories in own books" on public.categories to authenticated;
alter policy "Users manage transactions in own books" on public.transactions to authenticated;
alter policy "Users manage entries in own books" on public.transaction_entries to authenticated;
alter policy "Users manage budgets in own books" on public.budgets to authenticated;
alter policy "Users manage debts in own books" on public.debts to authenticated;
alter policy "Users manage debt payments in own books" on public.debt_payments to authenticated;
alter policy "Users manage fx rates in own books" on public.fx_rates to authenticated;

grant execute on function public.ensure_user_foundation() to authenticated;
grant execute on function public.create_financial_transaction(
  uuid,
  public.transaction_kind,
  uuid,
  text,
  text,
  timestamptz,
  jsonb,
  bigint,
  numeric,
  uuid
) to authenticated;
grant execute on function public.update_financial_transaction(
  uuid,
  public.transaction_kind,
  uuid,
  text,
  text,
  timestamptz,
  jsonb,
  bigint,
  numeric
) to authenticated;
grant execute on function public.delete_financial_transaction(uuid) to authenticated;
grant execute on function public.get_wallet_balances(uuid) to authenticated;
grant execute on function public.get_period_summary(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_budget_progress(uuid, date) to authenticated;
grant execute on function public.get_category_report(uuid, timestamptz, timestamptz, public.category_kind) to authenticated;

notify pgrst, 'reload schema';
