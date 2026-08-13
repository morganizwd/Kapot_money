create extension if not exists pgcrypto;

create type public.wallet_type as enum (
  'cash',
  'bank_card',
  'bank_account',
  'savings',
  'deposit',
  'ewallet',
  'credit',
  'receivable',
  'liability',
  'other'
);

create type public.category_kind as enum ('income', 'expense');
create type public.transaction_kind as enum ('income', 'expense', 'transfer', 'adjustment');
create type public.budget_period as enum ('monthly', 'yearly', 'custom');
create type public.debt_kind as enum ('receivable', 'payable');
create type public.debt_status as enum ('open', 'settled', 'archived');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  default_currency varchar(3) not null default 'BYN',
  timezone text not null default 'Europe/Minsk',
  locale text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_default_currency_upper check (default_currency = upper(default_currency)),
  constraint user_profiles_default_currency_len check (char_length(default_currency) = 3),
  constraint user_profiles_locale_not_blank check (length(btrim(locale)) > 0),
  constraint user_profiles_timezone_not_blank check (length(btrim(timezone)) > 0)
);

create table public.finance_books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  base_currency varchar(3) not null default 'BYN',
  icon text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_books_name_not_blank check (length(btrim(name)) > 0),
  constraint finance_books_base_currency_upper check (base_currency = upper(base_currency)),
  constraint finance_books_base_currency_len check (char_length(base_currency) = 3)
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.finance_books(id) on delete cascade,
  name text not null,
  type public.wallet_type not null default 'other',
  currency_code varchar(3) not null,
  opening_balance_minor bigint not null default 0,
  opening_balance_date date not null default current_date,
  icon text,
  sort_order integer not null default 0,
  include_in_net_worth boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_name_not_blank check (length(btrim(name)) > 0),
  constraint wallets_currency_upper check (currency_code = upper(currency_code)),
  constraint wallets_currency_len check (char_length(currency_code) = 3)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.finance_books(id) on delete cascade,
  name text not null,
  kind public.category_kind not null,
  parent_id uuid references public.categories(id) on delete restrict,
  icon text,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (length(btrim(name)) > 0)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.finance_books(id) on delete cascade,
  kind public.transaction_kind not null,
  category_id uuid references public.categories(id) on delete restrict,
  description text,
  note text,
  occurred_at timestamptz not null default now(),
  reporting_amount_minor bigint,
  exchange_rate numeric,
  idempotency_key uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_transfer_without_category check (
    (kind = 'transfer' and category_id is null)
    or (kind <> 'transfer')
  ),
  constraint transactions_reporting_non_negative check (
    reporting_amount_minor is null or reporting_amount_minor >= 0
  ),
  constraint transactions_exchange_positive check (exchange_rate is null or exchange_rate > 0),
  constraint transactions_idempotency_unique unique (book_id, idempotency_key)
);

create table public.transaction_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  amount_minor bigint not null,
  currency_code varchar(3) not null,
  created_at timestamptz not null default now(),
  constraint transaction_entries_amount_nonzero check (amount_minor <> 0),
  constraint transaction_entries_currency_upper check (currency_code = upper(currency_code)),
  constraint transaction_entries_currency_len check (char_length(currency_code) = 3)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.finance_books(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount_minor bigint not null,
  currency_code varchar(3) not null,
  period public.budget_period not null default 'monthly',
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_amount_positive check (amount_minor > 0),
  constraint budgets_currency_upper check (currency_code = upper(currency_code)),
  constraint budgets_currency_len check (char_length(currency_code) = 3),
  constraint budgets_dates_valid check (ends_on is null or ends_on >= starts_on)
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.finance_books(id) on delete cascade,
  kind public.debt_kind not null,
  counterparty_name text not null,
  principal_amount_minor bigint not null,
  currency_code varchar(3) not null,
  wallet_id uuid references public.wallets(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  due_on date,
  status public.debt_status not null default 'open',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_counterparty_not_blank check (length(btrim(counterparty_name)) > 0),
  constraint debts_principal_positive check (principal_amount_minor > 0),
  constraint debts_currency_upper check (currency_code = upper(currency_code)),
  constraint debts_currency_len check (char_length(currency_code) = 3)
);

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  amount_minor bigint not null,
  paid_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  constraint debt_payments_amount_positive check (amount_minor > 0)
);

create table public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.finance_books(id) on delete cascade,
  base_currency varchar(3) not null,
  quote_currency varchar(3) not null,
  rate numeric not null,
  rated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint fx_rates_currency_pair_distinct check (base_currency <> quote_currency),
  constraint fx_rates_base_currency_upper check (base_currency = upper(base_currency)),
  constraint fx_rates_quote_currency_upper check (quote_currency = upper(quote_currency)),
  constraint fx_rates_base_currency_len check (char_length(base_currency) = 3),
  constraint fx_rates_quote_currency_len check (char_length(quote_currency) = 3),
  constraint fx_rates_rate_positive check (rate > 0)
);

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger set_finance_books_updated_at
before update on public.finance_books
for each row execute function public.set_updated_at();

create trigger set_wallets_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger set_budgets_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

create trigger set_debts_updated_at
before update on public.debts
for each row execute function public.set_updated_at();

create index finance_books_owner_id_idx on public.finance_books(owner_id);
create index wallets_book_id_idx on public.wallets(book_id);
create index wallets_book_id_sort_order_idx on public.wallets(book_id, sort_order, created_at);
create index categories_book_id_idx on public.categories(book_id);
create index categories_book_id_kind_idx on public.categories(book_id, kind, sort_order);
create index categories_parent_id_idx on public.categories(parent_id);
create index transactions_book_id_idx on public.transactions(book_id);
create index transactions_book_id_occurred_at_idx on public.transactions(book_id, occurred_at desc);
create index transactions_category_id_idx on public.transactions(category_id);
create index transaction_entries_transaction_id_idx on public.transaction_entries(transaction_id);
create index transaction_entries_wallet_id_idx on public.transaction_entries(wallet_id);
create index budgets_book_id_idx on public.budgets(book_id);
create index budgets_category_id_idx on public.budgets(category_id);
create index budgets_period_idx on public.budgets(book_id, starts_on, ends_on);
create index debts_book_id_idx on public.debts(book_id);
create index debt_payments_debt_id_idx on public.debt_payments(debt_id);
create index fx_rates_book_pair_idx on public.fx_rates(book_id, base_currency, quote_currency, rated_at desc);

alter table public.user_profiles enable row level security;
alter table public.finance_books enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_entries enable row level security;
alter table public.budgets enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.fx_rates enable row level security;

create or replace function public.is_book_owner(p_book_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.finance_books fb
    where fb.id = p_book_id
      and fb.owner_id = auth.uid()
  );
$$;

create or replace function public.transaction_book_id(p_transaction_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.book_id
  from public.transactions t
  where t.id = p_transaction_id;
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
  where d.id = p_debt_id;
$$;

create policy "Users manage own profile" on public.user_profiles
for all using (id = auth.uid())
with check (id = auth.uid());

create policy "Users manage own finance books" on public.finance_books
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users manage wallets in own books" on public.wallets
for all using (public.is_book_owner(book_id))
with check (public.is_book_owner(book_id));

create policy "Users manage categories in own books" on public.categories
for all using (public.is_book_owner(book_id))
with check (public.is_book_owner(book_id));

create policy "Users manage transactions in own books" on public.transactions
for all using (public.is_book_owner(book_id))
with check (public.is_book_owner(book_id));

create policy "Users manage entries in own books" on public.transaction_entries
for all using (public.is_book_owner(public.transaction_book_id(transaction_id)))
with check (public.is_book_owner(public.transaction_book_id(transaction_id)));

create policy "Users manage budgets in own books" on public.budgets
for all using (public.is_book_owner(book_id))
with check (public.is_book_owner(book_id));

create policy "Users manage debts in own books" on public.debts
for all using (public.is_book_owner(book_id))
with check (public.is_book_owner(book_id));

create policy "Users manage debt payments in own books" on public.debt_payments
for all using (public.is_book_owner(public.debt_book_id(debt_id)))
with check (public.is_book_owner(public.debt_book_id(debt_id)));

create policy "Users manage fx rates in own books" on public.fx_rates
for all using (public.is_book_owner(book_id))
with check (public.is_book_owner(book_id));

create or replace function public.validate_category_for_transaction(
  p_book_id uuid,
  p_kind public.transaction_kind,
  p_category_id uuid
)
returns void
language plpgsql
security definer
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
security definer
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

create or replace function public.create_financial_transaction(
  p_book_id uuid,
  p_kind public.transaction_kind,
  p_category_id uuid,
  p_description text,
  p_note text,
  p_occurred_at timestamptz,
  p_entries jsonb,
  p_reporting_amount_minor bigint default null,
  p_exchange_rate numeric default null,
  p_idempotency_key uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_transaction_id uuid;
  v_entry jsonb;
begin
  if not public.is_book_owner(p_book_id) then
    raise exception 'book_not_found' using errcode = 'P0001';
  end if;

  perform public.validate_category_for_transaction(p_book_id, p_kind, p_category_id);
  perform public.validate_transaction_entries(p_book_id, p_kind, p_entries);

  if p_idempotency_key is not null then
    select id into v_transaction_id
    from public.transactions
    where book_id = p_book_id and idempotency_key = p_idempotency_key;

    if v_transaction_id is not null then
      return v_transaction_id;
    end if;
  end if;

  insert into public.transactions (
    book_id,
    kind,
    category_id,
    description,
    note,
    occurred_at,
    reporting_amount_minor,
    exchange_rate,
    idempotency_key
  )
  values (
    p_book_id,
    p_kind,
    p_category_id,
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_note, '')), ''),
    p_occurred_at,
    p_reporting_amount_minor,
    p_exchange_rate,
    p_idempotency_key
  )
  returning id into v_transaction_id;

  for v_entry in select value from jsonb_array_elements(p_entries)
  loop
    insert into public.transaction_entries (
      transaction_id,
      wallet_id,
      amount_minor,
      currency_code
    )
    values (
      v_transaction_id,
      (v_entry->>'wallet_id')::uuid,
      (v_entry->>'amount_minor')::bigint,
      upper(v_entry->>'currency_code')
    );
  end loop;

  return v_transaction_id;
end;
$$;

create or replace function public.update_financial_transaction(
  p_transaction_id uuid,
  p_kind public.transaction_kind,
  p_category_id uuid,
  p_description text,
  p_note text,
  p_occurred_at timestamptz,
  p_entries jsonb,
  p_reporting_amount_minor bigint default null,
  p_exchange_rate numeric default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_book_id uuid;
  v_entry jsonb;
begin
  select t.book_id into v_book_id
  from public.transactions t
  where t.id = p_transaction_id;

  if v_book_id is null or not public.is_book_owner(v_book_id) then
    raise exception 'transaction_not_found' using errcode = 'P0001';
  end if;

  perform public.validate_category_for_transaction(v_book_id, p_kind, p_category_id);
  perform public.validate_transaction_entries(v_book_id, p_kind, p_entries);

  update public.transactions
  set
    kind = p_kind,
    category_id = p_category_id,
    description = nullif(btrim(coalesce(p_description, '')), ''),
    note = nullif(btrim(coalesce(p_note, '')), ''),
    occurred_at = p_occurred_at,
    reporting_amount_minor = p_reporting_amount_minor,
    exchange_rate = p_exchange_rate
  where id = p_transaction_id;

  delete from public.transaction_entries
  where transaction_id = p_transaction_id;

  for v_entry in select value from jsonb_array_elements(p_entries)
  loop
    insert into public.transaction_entries (
      transaction_id,
      wallet_id,
      amount_minor,
      currency_code
    )
    values (
      p_transaction_id,
      (v_entry->>'wallet_id')::uuid,
      (v_entry->>'amount_minor')::bigint,
      upper(v_entry->>'currency_code')
    );
  end loop;

  return p_transaction_id;
end;
$$;

create or replace function public.delete_financial_transaction(p_transaction_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_book_id uuid;
begin
  select t.book_id into v_book_id
  from public.transactions t
  where t.id = p_transaction_id;

  if v_book_id is null or not public.is_book_owner(v_book_id) then
    raise exception 'transaction_not_found' using errcode = 'P0001';
  end if;

  delete from public.transactions where id = p_transaction_id;
end;
$$;

create or replace function public.get_wallet_balances(p_book_id uuid)
returns table (
  id uuid,
  book_id uuid,
  name text,
  type public.wallet_type,
  currency_code varchar(3),
  opening_balance_minor bigint,
  opening_balance_date date,
  icon text,
  sort_order integer,
  include_in_net_worth boolean,
  is_archived boolean,
  created_at timestamptz,
  updated_at timestamptz,
  current_balance_minor bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    w.id,
    w.book_id,
    w.name,
    w.type,
    w.currency_code,
    w.opening_balance_minor,
    w.opening_balance_date,
    w.icon,
    w.sort_order,
    w.include_in_net_worth,
    w.is_archived,
    w.created_at,
    w.updated_at,
    w.opening_balance_minor + coalesce(sum(te.amount_minor), 0)::bigint as current_balance_minor
  from public.wallets w
  left join public.transaction_entries te on te.wallet_id = w.id
  where w.book_id = p_book_id
    and public.is_book_owner(w.book_id)
  group by w.id
  order by w.sort_order asc, w.created_at asc;
$$;

create or replace function public.get_period_summary(
  p_book_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  income_minor bigint,
  expense_minor bigint,
  cash_flow_minor bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with scoped as (
    select
      t.kind,
      abs(sum(te.amount_minor))::bigint as amount_minor
    from public.transactions t
    join public.transaction_entries te on te.transaction_id = t.id
    where t.book_id = p_book_id
      and public.is_book_owner(t.book_id)
      and t.occurred_at >= p_from
      and t.occurred_at <= p_to
      and t.kind in ('income', 'expense')
    group by t.id, t.kind
  )
  select
    coalesce(sum(amount_minor) filter (where kind = 'income'), 0)::bigint,
    coalesce(sum(amount_minor) filter (where kind = 'expense'), 0)::bigint,
    (
      coalesce(sum(amount_minor) filter (where kind = 'income'), 0)
      - coalesce(sum(amount_minor) filter (where kind = 'expense'), 0)
    )::bigint
  from scoped;
$$;

create or replace function public.get_budget_progress(
  p_book_id uuid,
  p_on date default current_date
)
returns table (
  budget_id uuid,
  category_id uuid,
  category_name text,
  amount_minor bigint,
  currency_code varchar(3),
  period public.budget_period,
  spent_minor bigint,
  remaining_minor bigint,
  progress_percent numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    b.id,
    b.category_id,
    c.name,
    b.amount_minor,
    b.currency_code,
    b.period,
    coalesce(sum(abs(te.amount_minor)) filter (
      where t.kind = 'expense'
        and t.occurred_at::date >= b.starts_on
        and t.occurred_at::date <= coalesce(b.ends_on, case
          when b.period = 'monthly' then (date_trunc('month', b.starts_on)::date + interval '1 month - 1 day')::date
          when b.period = 'yearly' then (date_trunc('year', b.starts_on)::date + interval '1 year - 1 day')::date
          else p_on
        end)
    ), 0)::bigint as spent_minor,
    (
      b.amount_minor - coalesce(sum(abs(te.amount_minor)) filter (
        where t.kind = 'expense'
          and t.occurred_at::date >= b.starts_on
          and t.occurred_at::date <= coalesce(b.ends_on, case
            when b.period = 'monthly' then (date_trunc('month', b.starts_on)::date + interval '1 month - 1 day')::date
            when b.period = 'yearly' then (date_trunc('year', b.starts_on)::date + interval '1 year - 1 day')::date
            else p_on
          end)
      ), 0)
    )::bigint as remaining_minor,
    round(
      least(
        999,
        (
          coalesce(sum(abs(te.amount_minor)) filter (
            where t.kind = 'expense'
              and t.occurred_at::date >= b.starts_on
              and t.occurred_at::date <= coalesce(b.ends_on, case
                when b.period = 'monthly' then (date_trunc('month', b.starts_on)::date + interval '1 month - 1 day')::date
                when b.period = 'yearly' then (date_trunc('year', b.starts_on)::date + interval '1 year - 1 day')::date
                else p_on
              end)
          ), 0)::numeric / b.amount_minor::numeric
        ) * 100
      ),
      2
    ) as progress_percent
  from public.budgets b
  join public.categories c on c.id = b.category_id
  left join public.transactions t on t.category_id = b.category_id and t.book_id = b.book_id
  left join public.transaction_entries te on te.transaction_id = t.id and te.currency_code = b.currency_code
  where b.book_id = p_book_id
    and public.is_book_owner(b.book_id)
    and b.starts_on <= p_on
    and (b.ends_on is null or b.ends_on >= p_on)
  group by b.id, c.name
  order by c.name;
$$;

create or replace function public.get_category_report(
  p_book_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_kind public.category_kind
)
returns table (
  category_id uuid,
  category_name text,
  kind public.category_kind,
  amount_minor bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    c.name,
    c.kind,
    coalesce(sum(abs(te.amount_minor)), 0)::bigint as amount_minor
  from public.categories c
  join public.transactions t on t.category_id = c.id
  join public.transaction_entries te on te.transaction_id = t.id
  where c.book_id = p_book_id
    and public.is_book_owner(c.book_id)
    and c.kind = p_kind
    and t.kind = p_kind::text::public.transaction_kind
    and t.occurred_at >= p_from
    and t.occurred_at <= p_to
  group by c.id
  order by amount_minor desc, c.name asc;
$$;

create or replace function public.create_foundation_for_user(
  p_user_id uuid,
  p_display_name text default null,
  p_default_currency varchar(3) default 'BYN',
  p_timezone text default 'Europe/Minsk',
  p_locale text default 'ru'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_book_id uuid;
  v_income_categories text[] := array['Зарплата', 'Подработка', 'Бизнес', 'Продажи', 'Подарки', 'Проценты', 'Прочее'];
  v_expense_categories text[] := array['Продукты', 'Кафе', 'Автомобиль', 'Дом', 'Развлечения', 'Подписки', 'Одежда', 'Здоровье', 'Подарки', 'Путешествия', 'Образование', 'Связь', 'Другое'];
  v_name text;
  v_order int := 0;
begin
  insert into public.user_profiles (id, display_name, default_currency, timezone, locale)
  values (
    p_user_id,
    nullif(btrim(coalesce(p_display_name, '')), ''),
    upper(coalesce(p_default_currency, 'BYN')),
    coalesce(nullif(btrim(p_timezone), ''), 'Europe/Minsk'),
    coalesce(nullif(btrim(p_locale), ''), 'ru')
  )
  on conflict (id) do nothing;

  select id into v_book_id
  from public.finance_books
  where owner_id = p_user_id and is_archived = false
  order by created_at asc
  limit 1;

  if v_book_id is null then
    insert into public.finance_books (owner_id, name, base_currency, icon)
    values (p_user_id, 'Личные финансы', upper(coalesce(p_default_currency, 'BYN')), 'wallet')
    returning id into v_book_id;

    foreach v_name in array v_income_categories
    loop
      insert into public.categories (book_id, name, kind, sort_order)
      values (v_book_id, v_name, 'income', v_order);
      v_order := v_order + 10;
    end loop;

    v_order := 0;

    foreach v_name in array v_expense_categories
    loop
      insert into public.categories (book_id, name, kind, sort_order)
      values (v_book_id, v_name, 'expense', v_order);
      v_order := v_order + 10;
    end loop;
  end if;

  return v_book_id;
end;
$$;

revoke execute on function public.create_foundation_for_user(uuid, text, varchar, text, text) from public;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_foundation_for_user(
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'default_currency', 'BYN'),
    coalesce(new.raw_user_meta_data->>'timezone', 'Europe/Minsk'),
    coalesce(new.raw_user_meta_data->>'locale', 'ru')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.ensure_user_foundation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_book_id uuid;
  v_default_currency varchar(3);
  v_income_categories text[] := array['Зарплата', 'Подработка', 'Бизнес', 'Продажи', 'Подарки', 'Проценты', 'Прочее'];
  v_expense_categories text[] := array['Продукты', 'Кафе', 'Автомобиль', 'Дом', 'Развлечения', 'Подписки', 'Одежда', 'Здоровье', 'Подарки', 'Путешествия', 'Образование', 'Связь', 'Другое'];
  v_name text;
  v_order int := 0;
begin
  if v_user_id is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;

  select default_currency into v_default_currency
  from public.user_profiles
  where id = v_user_id;

  return public.create_foundation_for_user(
    v_user_id,
    null,
    coalesce(v_default_currency, 'BYN'),
    'Europe/Minsk',
    'ru'
  );
end;
$$;

revoke execute on function public.ensure_user_foundation() from public;
grant execute on function public.ensure_user_foundation() to authenticated;
