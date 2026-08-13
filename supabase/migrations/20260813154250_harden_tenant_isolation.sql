-- Tenant boundary: every related record must stay inside the same finance book.
-- RLS protects visibility; these checks also protect direct Data API mutations.

create or replace function public.transaction_book_id(p_transaction_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.book_id
  from public.transactions t
  where t.id = p_transaction_id
    and public.is_book_owner(t.book_id);
$$;

create or replace function public.debt_book_id(p_debt_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.book_id
  from public.debts d
  where d.id = p_debt_id
    and public.is_book_owner(d.book_id);
$$;

create or replace function public.validate_category_for_transaction(
  p_book_id uuid,
  p_kind public.transaction_kind,
  p_category_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_category_kind public.category_kind;
begin
  if p_kind in ('income', 'expense') and p_category_id is null then
    raise exception 'category_required' using errcode = 'P0001';
  end if;

  if p_kind in ('transfer', 'adjustment') and p_category_id is not null then
    raise exception 'category_forbidden' using errcode = 'P0001';
  end if;

  if p_category_id is not null then
    select c.kind into v_category_kind
    from public.categories c
    where c.id = p_category_id
      and c.book_id = p_book_id
      and c.is_archived = false;

    if v_category_kind is null then
      raise exception 'category_not_found' using errcode = 'P0001';
    end if;

    if p_kind = 'income' and v_category_kind <> 'income' then
      raise exception 'income_category_required' using errcode = 'P0001';
    end if;

    if p_kind = 'expense' and v_category_kind <> 'expense' then
      raise exception 'expense_category_required' using errcode = 'P0001';
    end if;
  end if;
end;
$$;

create or replace function public.validate_transaction_entries(
  p_book_id uuid,
  p_kind public.transaction_kind,
  p_entries jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count int;
  v_positive_count int;
  v_negative_count int;
  v_total bigint;
  v_first_wallet uuid;
  v_second_wallet uuid;
  v_entry jsonb;
  v_wallet_currency varchar(3);
  v_wallet_book uuid;
  v_amount bigint;
  v_currency varchar(3);
begin
  if jsonb_typeof(p_entries) <> 'array' then
    raise exception 'entries_must_be_array' using errcode = 'P0001';
  end if;

  select
    count(*),
    count(*) filter (where (value->>'amount_minor')::bigint > 0),
    count(*) filter (where (value->>'amount_minor')::bigint < 0),
    coalesce(sum((value->>'amount_minor')::bigint), 0)
  into v_count, v_positive_count, v_negative_count, v_total
  from jsonb_array_elements(p_entries);

  if p_kind in ('income', 'expense', 'adjustment') and v_count <> 1 then
    raise exception 'single_entry_required' using errcode = 'P0001';
  end if;

  if p_kind = 'transfer' and v_count <> 2 then
    raise exception 'transfer_requires_two_entries' using errcode = 'P0001';
  end if;

  if p_kind = 'income' and (v_positive_count <> 1 or v_negative_count <> 0) then
    raise exception 'income_entry_must_be_positive' using errcode = 'P0001';
  end if;

  if p_kind = 'expense' and (v_negative_count <> 1 or v_positive_count <> 0) then
    raise exception 'expense_entry_must_be_negative' using errcode = 'P0001';
  end if;

  if p_kind = 'transfer' and (v_positive_count <> 1 or v_negative_count <> 1) then
    raise exception 'transfer_requires_in_and_out' using errcode = 'P0001';
  end if;

  if p_kind = 'adjustment' and v_total = 0 then
    raise exception 'adjustment_must_change_balance' using errcode = 'P0001';
  end if;

  for v_entry in select value from jsonb_array_elements(p_entries)
  loop
    v_amount := (v_entry->>'amount_minor')::bigint;
    v_currency := upper(v_entry->>'currency_code');

    if v_amount = 0 then
      raise exception 'amount_must_be_nonzero' using errcode = 'P0001';
    end if;

    if char_length(v_currency) <> 3 then
      raise exception 'invalid_currency' using errcode = 'P0001';
    end if;

    select w.book_id, w.currency_code
      into v_wallet_book, v_wallet_currency
    from public.wallets w
    where w.id = (v_entry->>'wallet_id')::uuid
      and w.is_archived = false;

    if v_wallet_book is null or v_wallet_book <> p_book_id then
      raise exception 'wallet_not_found' using errcode = 'P0001';
    end if;

    if v_wallet_currency <> v_currency then
      raise exception 'entry_currency_must_match_wallet' using errcode = 'P0001';
    end if;
  end loop;

  if p_kind = 'transfer' then
    select (value->>'wallet_id')::uuid
    into v_first_wallet
    from jsonb_array_elements(p_entries)
    order by (value->>'amount_minor')::bigint
    limit 1;

    select (value->>'wallet_id')::uuid
    into v_second_wallet
    from jsonb_array_elements(p_entries)
    order by (value->>'amount_minor')::bigint desc
    limit 1;

    if v_first_wallet = v_second_wallet then
      raise exception 'transfer_wallets_must_differ' using errcode = 'P0001';
    end if;
  end if;
end;
$$;

create or replace function public.enforce_category_parent_book()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_id is not null and not exists (
    select 1
    from public.categories parent_category
    where parent_category.id = new.parent_id
      and parent_category.book_id = new.book_id
  ) then
    raise exception 'cross_book_reference' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_transaction_category_book()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (
    select 1
    from public.categories category_record
    where category_record.id = new.category_id
      and category_record.book_id = new.book_id
  ) then
    raise exception 'cross_book_reference' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_transaction_entry_book()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_book_id uuid;
begin
  select t.book_id into v_transaction_book_id
  from public.transactions t
  where t.id = new.transaction_id;

  if v_transaction_book_id is null or not exists (
    select 1
    from public.wallets wallet_record
    where wallet_record.id = new.wallet_id
      and wallet_record.book_id = v_transaction_book_id
  ) then
    raise exception 'cross_book_reference' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_budget_category_book()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.categories category_record
    where category_record.id = new.category_id
      and category_record.book_id = new.book_id
  ) then
    raise exception 'cross_book_reference' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_debt_relations_book()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.wallet_id is not null and not exists (
    select 1
    from public.wallets wallet_record
    where wallet_record.id = new.wallet_id
      and wallet_record.book_id = new.book_id
  ) then
    raise exception 'cross_book_reference' using errcode = '23514';
  end if;

  if new.category_id is not null and not exists (
    select 1
    from public.categories category_record
    where category_record.id = new.category_id
      and category_record.book_id = new.book_id
  ) then
    raise exception 'cross_book_reference' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_debt_payment_book()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debt_book_id uuid;
begin
  if new.transaction_id is null then
    return new;
  end if;

  select d.book_id into v_debt_book_id
  from public.debts d
  where d.id = new.debt_id;

  if v_debt_book_id is null or not exists (
    select 1
    from public.transactions transaction_record
    where transaction_record.id = new.transaction_id
      and transaction_record.book_id = v_debt_book_id
  ) then
    raise exception 'cross_book_reference' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_category_parent_book on public.categories;
create trigger enforce_category_parent_book
before insert or update of book_id, parent_id on public.categories
for each row execute function public.enforce_category_parent_book();

drop trigger if exists enforce_transaction_category_book on public.transactions;
create trigger enforce_transaction_category_book
before insert or update of book_id, category_id on public.transactions
for each row execute function public.enforce_transaction_category_book();

drop trigger if exists enforce_transaction_entry_book on public.transaction_entries;
create trigger enforce_transaction_entry_book
before insert or update of transaction_id, wallet_id on public.transaction_entries
for each row execute function public.enforce_transaction_entry_book();

drop trigger if exists enforce_budget_category_book on public.budgets;
create trigger enforce_budget_category_book
before insert or update of book_id, category_id on public.budgets
for each row execute function public.enforce_budget_category_book();

drop trigger if exists enforce_debt_relations_book on public.debts;
create trigger enforce_debt_relations_book
before insert or update of book_id, wallet_id, category_id on public.debts
for each row execute function public.enforce_debt_relations_book();

drop trigger if exists enforce_debt_payment_book on public.debt_payments;
create trigger enforce_debt_payment_book
before insert or update of debt_id, transaction_id on public.debt_payments
for each row execute function public.enforce_debt_payment_book();

-- PostgreSQL grants EXECUTE to PUBLIC by default. Keep only the authenticated
-- surface required by the application and its RLS policies.
revoke all on function public.set_updated_at() from public;
revoke all on function public.is_book_owner(uuid) from public;
revoke all on function public.transaction_book_id(uuid) from public;
revoke all on function public.debt_book_id(uuid) from public;
revoke all on function public.validate_category_for_transaction(uuid, public.transaction_kind, uuid) from public;
revoke all on function public.validate_transaction_entries(uuid, public.transaction_kind, jsonb) from public;
revoke all on function public.create_financial_transaction(uuid, public.transaction_kind, uuid, text, text, timestamptz, jsonb, bigint, numeric, uuid) from public;
revoke all on function public.update_financial_transaction(uuid, public.transaction_kind, uuid, text, text, timestamptz, jsonb, bigint, numeric) from public;
revoke all on function public.delete_financial_transaction(uuid) from public;
revoke all on function public.get_wallet_balances(uuid) from public;
revoke all on function public.get_period_summary(uuid, timestamptz, timestamptz) from public;
revoke all on function public.get_budget_progress(uuid, date) from public;
revoke all on function public.get_category_report(uuid, timestamptz, timestamptz, public.category_kind) from public;
revoke all on function public.create_foundation_for_user(uuid, text, varchar, text, text) from public;
revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.ensure_user_foundation() from public;
revoke all on function public.enforce_category_parent_book() from public;
revoke all on function public.enforce_transaction_category_book() from public;
revoke all on function public.enforce_transaction_entry_book() from public;
revoke all on function public.enforce_budget_category_book() from public;
revoke all on function public.enforce_debt_relations_book() from public;
revoke all on function public.enforce_debt_payment_book() from public;

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

notify pgrst, 'reload schema';
