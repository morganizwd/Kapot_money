create or replace function public.set_wallet_balance(
  p_wallet_id uuid,
  p_target_balance_minor bigint,
  p_occurred_at timestamptz default now(),
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_book_id uuid;
  v_currency_code varchar(3);
  v_opening_balance_minor bigint;
  v_current_balance_minor bigint;
  v_adjustment_minor bigint;
  v_transaction_id uuid;
begin
  if p_target_balance_minor is null then
    raise exception 'target_balance_required' using errcode = 'P0001';
  end if;

  select
    w.book_id,
    w.currency_code,
    w.opening_balance_minor
  into
    v_book_id,
    v_currency_code,
    v_opening_balance_minor
  from public.wallets w
  where w.id = p_wallet_id
    and w.is_archived = false
    and public.is_book_owner(w.book_id)
  for update;

  if v_book_id is null then
    raise exception 'wallet_not_found' using errcode = 'P0001';
  end if;

  select
    v_opening_balance_minor + coalesce(sum(te.amount_minor), 0)
  into v_current_balance_minor
  from public.transaction_entries te
  where te.wallet_id = p_wallet_id;

  v_adjustment_minor := p_target_balance_minor - v_current_balance_minor;

  if v_adjustment_minor = 0 then
    return null;
  end if;

  select public.create_financial_transaction(
    v_book_id,
    'adjustment',
    null,
    'Корректировка баланса',
    p_note,
    coalesce(p_occurred_at, now()),
    jsonb_build_array(
      jsonb_build_object(
        'wallet_id', p_wallet_id,
        'amount_minor', v_adjustment_minor::text,
        'currency_code', v_currency_code
      )
    ),
    null,
    null,
    gen_random_uuid()
  ) into v_transaction_id;

  return v_transaction_id;
end;
$$;

revoke all on function public.set_wallet_balance(uuid, bigint, timestamptz, text) from public, anon;
grant execute on function public.set_wallet_balance(uuid, bigint, timestamptz, text) to authenticated;
