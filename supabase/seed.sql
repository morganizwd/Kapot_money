-- Development seed. Run manually against a local Supabase database only.
-- Create Demo User through Supabase Auth first, then run:
-- select set_config('app.demo_user_id', '<demo-user-uuid>', false);
-- \i supabase/seed.sql

do $$
declare
  v_user_id uuid := nullif(current_setting('app.demo_user_id', true), '')::uuid;
  v_book_id uuid;
  v_priorbank_id uuid;
  v_cash_id uuid;
  v_savings_id uuid;
  v_salary_id uuid;
  v_products_id uuid;
  v_cafe_id uuid;
  v_fuel_id uuid;
  v_transaction_id uuid;
begin
  if v_user_id is null then
    raise notice 'Set app.demo_user_id before running seed.sql';
    return;
  end if;

  perform public.create_foundation_for_user(v_user_id, 'Demo User', 'BYN', 'Europe/Minsk', 'ru');

  select id into v_book_id
  from public.finance_books
  where owner_id = v_user_id
  order by created_at asc
  limit 1;

  insert into public.wallets (book_id, name, type, currency_code, opening_balance_minor, opening_balance_date, sort_order)
  values
    (v_book_id, 'Priorbank', 'bank_card', 'BYN', 250000, current_date, 10),
    (v_book_id, 'Cash', 'cash', 'BYN', 30000, current_date, 20),
    (v_book_id, 'Savings', 'savings', 'BYN', 500000, current_date, 30)
  on conflict do nothing;

  select id into v_priorbank_id from public.wallets where book_id = v_book_id and name = 'Priorbank' limit 1;
  select id into v_cash_id from public.wallets where book_id = v_book_id and name = 'Cash' limit 1;
  select id into v_savings_id from public.wallets where book_id = v_book_id and name = 'Savings' limit 1;
  select id into v_salary_id from public.categories where book_id = v_book_id and name = 'Зарплата' and kind = 'income' limit 1;
  select id into v_products_id from public.categories where book_id = v_book_id and name = 'Продукты' and kind = 'expense' limit 1;
  select id into v_cafe_id from public.categories where book_id = v_book_id and name = 'Кафе' and kind = 'expense' limit 1;
  select id into v_fuel_id from public.categories where book_id = v_book_id and name = 'Автомобиль' and kind = 'expense' limit 1;

  insert into public.transactions (book_id, kind, category_id, description, occurred_at)
  values (v_book_id, 'income', v_salary_id, 'Salary', now() - interval '5 days')
  returning id into v_transaction_id;
  insert into public.transaction_entries (transaction_id, wallet_id, amount_minor, currency_code)
  values (v_transaction_id, v_priorbank_id, 300000, 'BYN');

  insert into public.transactions (book_id, kind, category_id, description, occurred_at)
  values (v_book_id, 'expense', v_products_id, 'Products', now() - interval '4 days')
  returning id into v_transaction_id;
  insert into public.transaction_entries (transaction_id, wallet_id, amount_minor, currency_code)
  values (v_transaction_id, v_priorbank_id, -8500, 'BYN');

  insert into public.transactions (book_id, kind, category_id, description, occurred_at)
  values (v_book_id, 'expense', v_cafe_id, 'Cafe', now() - interval '3 days')
  returning id into v_transaction_id;
  insert into public.transaction_entries (transaction_id, wallet_id, amount_minor, currency_code)
  values (v_transaction_id, v_cash_id, -2400, 'BYN');

  insert into public.transactions (book_id, kind, category_id, description, occurred_at)
  values (v_book_id, 'expense', v_fuel_id, 'Fuel', now() - interval '2 days')
  returning id into v_transaction_id;
  insert into public.transaction_entries (transaction_id, wallet_id, amount_minor, currency_code)
  values (v_transaction_id, v_priorbank_id, -12000, 'BYN');

  insert into public.transactions (book_id, kind, description, occurred_at)
  values (v_book_id, 'transfer', 'Card to cash', now() - interval '1 day')
  returning id into v_transaction_id;
  insert into public.transaction_entries (transaction_id, wallet_id, amount_minor, currency_code)
  values
    (v_transaction_id, v_priorbank_id, -20000, 'BYN'),
    (v_transaction_id, v_cash_id, 20000, 'BYN');
end $$;
