create or replace function public.ensure_user_foundation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_default_currency varchar(3);
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
