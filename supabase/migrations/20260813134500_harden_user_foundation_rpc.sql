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
  v_order int;
begin
  if v_user_id is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;

  insert into public.user_profiles (id, default_currency, timezone, locale)
  values (v_user_id, 'BYN', 'Europe/Minsk', 'ru')
  on conflict (id) do nothing;

  select default_currency into v_default_currency
  from public.user_profiles
  where id = v_user_id;

  select id into v_book_id
  from public.finance_books
  where owner_id = v_user_id and is_archived = false
  order by created_at asc
  limit 1;

  if v_book_id is null then
    insert into public.finance_books (owner_id, name, base_currency, icon)
    values (v_user_id, 'Личные финансы', coalesce(v_default_currency, 'BYN'), 'wallet')
    returning id into v_book_id;
  end if;

  if not exists (select 1 from public.categories where book_id = v_book_id) then
    v_order := 0;
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

revoke execute on function public.ensure_user_foundation() from public;
grant execute on function public.ensure_user_foundation() to authenticated;

notify pgrst, 'reload schema';
