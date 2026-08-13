-- Supabase grants EXECUTE to API roles through default privileges on this
-- project. Revoke explicitly, then grant the minimal authenticated surface.

revoke all on function public.set_updated_at() from anon, authenticated;
revoke all on function public.is_book_owner(uuid) from anon, authenticated;
revoke all on function public.transaction_book_id(uuid) from anon, authenticated;
revoke all on function public.debt_book_id(uuid) from anon, authenticated;
revoke all on function public.validate_category_for_transaction(uuid, public.transaction_kind, uuid) from anon, authenticated;
revoke all on function public.validate_transaction_entries(uuid, public.transaction_kind, jsonb) from anon, authenticated;
revoke all on function public.create_financial_transaction(uuid, public.transaction_kind, uuid, text, text, timestamptz, jsonb, bigint, numeric, uuid) from anon, authenticated;
revoke all on function public.update_financial_transaction(uuid, public.transaction_kind, uuid, text, text, timestamptz, jsonb, bigint, numeric) from anon, authenticated;
revoke all on function public.delete_financial_transaction(uuid) from anon, authenticated;
revoke all on function public.get_wallet_balances(uuid) from anon, authenticated;
revoke all on function public.get_period_summary(uuid, timestamptz, timestamptz) from anon, authenticated;
revoke all on function public.get_budget_progress(uuid, date) from anon, authenticated;
revoke all on function public.get_category_report(uuid, timestamptz, timestamptz, public.category_kind) from anon, authenticated;
revoke all on function public.create_foundation_for_user(uuid, text, varchar, text, text) from anon, authenticated;
revoke all on function public.handle_new_auth_user() from anon, authenticated;
revoke all on function public.ensure_user_foundation() from anon, authenticated;
revoke all on function public.enforce_category_parent_book() from anon, authenticated;
revoke all on function public.enforce_transaction_category_book() from anon, authenticated;
revoke all on function public.enforce_transaction_entry_book() from anon, authenticated;
revoke all on function public.enforce_budget_category_book() from anon, authenticated;
revoke all on function public.enforce_debt_relations_book() from anon, authenticated;
revoke all on function public.enforce_debt_payment_book() from anon, authenticated;

grant execute on function public.is_book_owner(uuid) to authenticated;
grant execute on function public.transaction_book_id(uuid) to authenticated;
grant execute on function public.debt_book_id(uuid) to authenticated;
grant execute on function public.validate_category_for_transaction(uuid, public.transaction_kind, uuid) to authenticated;
grant execute on function public.validate_transaction_entries(uuid, public.transaction_kind, jsonb) to authenticated;
grant execute on function public.ensure_user_foundation() to authenticated;
grant execute on function public.create_financial_transaction(uuid, public.transaction_kind, uuid, text, text, timestamptz, jsonb, bigint, numeric, uuid) to authenticated;
grant execute on function public.update_financial_transaction(uuid, public.transaction_kind, uuid, text, text, timestamptz, jsonb, bigint, numeric) to authenticated;
grant execute on function public.delete_financial_transaction(uuid) to authenticated;
grant execute on function public.get_wallet_balances(uuid) to authenticated;
grant execute on function public.get_period_summary(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_budget_progress(uuid, date) to authenticated;
grant execute on function public.get_category_report(uuid, timestamptz, timestamptz, public.category_kind) to authenticated;

alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

notify pgrst, 'reload schema';
