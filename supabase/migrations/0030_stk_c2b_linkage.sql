-- 0030_stk_c2b_linkage.sql
--
-- Extends record_c2b_payment (defined in 0028) with STK<->C2B row pairing.
-- Bulletproof rebuild: explicit DROP, named dollar-tag, #variable_conflict
-- directive, and fully qualified columns.

alter table public.payments
  add column if not exists paired_payment_id uuid
    references public.payments(id) on delete set null;

create index if not exists payments_paired_idx
  on public.payments(paired_payment_id)
  where paired_payment_id is not null;

drop function if exists public.record_c2b_payment(
  text, numeric, text, text, text, text, text, text, numeric, jsonb, text
);
drop function if exists public.record_c2b_payment(
  text, numeric, text, text, text, text, text, text, numeric, jsonb
);

create function public.record_c2b_payment(
  p_transaction_id      text,
  p_amount              numeric,
  p_msisdn              text,
  p_bill_ref            text,
  p_business_short_code text,
  p_first_name          text,
  p_middle_name         text,
  p_last_name           text,
  p_org_balance         numeric,
  p_raw                 jsonb,
  p_trans_time          text default null
)
returns table (
  payment_id        uuid,
  was_duplicate     boolean,
  matched_tenant_id text,
  matched_unit_id   text
)
language plpgsql
security definer
set search_path = public
as $func$
#variable_conflict use_variable
declare
  v_existing_id uuid;
  v_payment_id  uuid;
  v_match       record;
  v_status      text;
  v_tenant_id   text;
  v_unit_id     text;
  v_created_at  timestamptz := now();
  v_twin_id     uuid;
begin
  select p.id, p.matched_tenant_id, p.matched_unit_id
    into v_existing_id, v_tenant_id, v_unit_id
  from public.payments p
  where p.transaction_id = p_transaction_id
  limit 1;

  if v_existing_id is not null then
    select * into v_match
    from public.find_active_tenant_by_unit_tag(p_bill_ref);

    v_tenant_id := coalesce(v_tenant_id, v_match.tenant_id);
    v_unit_id   := coalesce(v_unit_id,   v_match.unit_id);

    update public.payments p
       set bill_ref_number     = coalesce(p.bill_ref_number,     p_bill_ref),
           msisdn              = coalesce(p.msisdn,              p_msisdn),
           first_name          = coalesce(p.first_name,          p_first_name),
           middle_name         = coalesce(p.middle_name,         p_middle_name),
           last_name           = coalesce(p.last_name,           p_last_name),
           business_short_code = coalesce(p.business_short_code, p_business_short_code),
           org_account_balance = coalesce(p.org_account_balance, p_org_balance),
           matched_tenant_id   = v_tenant_id,
           matched_unit_id     = v_unit_id,
           reconciliation_status = case
             when v_tenant_id is not null then 'reconciled'
             else coalesce(p.reconciliation_status, 'unreconciled')
           end,
           raw_payload         = coalesce(p.raw_payload, p_raw),
           updated_at          = now()
     where p.id = v_existing_id;

    if v_tenant_id is not null then
      update public.tenants t
         set payment_history = jsonb_build_array(
               jsonb_build_object(
                 'date',      to_char(v_created_at, 'YYYY-MM-DD'),
                 'amount',    'KES ' || to_char(p_amount, 'FM999,999,999,990'),
                 'status',    'Paid',
                 'method',    'M-Pesa',
                 'reference', p_transaction_id
               )
             ) || coalesce(t.payment_history, '[]'::jsonb),
             updated_at = now()
       where t.id = v_tenant_id
         and not coalesce(
               t.payment_history @> jsonb_build_array(
                 jsonb_build_object('reference', p_transaction_id)
               ),
               false
             );
    end if;

    payment_id        := v_existing_id;
    was_duplicate     := true;
    matched_tenant_id := v_tenant_id;
    matched_unit_id   := v_unit_id;
    return next;
    return;
  end if;

  select * into v_match
  from public.find_active_tenant_by_unit_tag(p_bill_ref);

  v_status := case
    when v_match.tenant_id is not null then 'reconciled'
    else 'unreconciled'
  end;

  insert into public.payments (
    source, status, reconciliation_status,
    amount, transaction_id,
    bill_ref_number, msisdn, phone, business_short_code,
    first_name, middle_name, last_name,
    org_account_balance, matched_tenant_id, matched_unit_id,
    raw_payload, result_code, result_desc
  ) values (
    'c2b', 'completed', v_status,
    p_amount, p_transaction_id,
    p_bill_ref, p_msisdn, p_msisdn, p_business_short_code,
    p_first_name, p_middle_name, p_last_name,
    p_org_balance, v_match.tenant_id, v_match.unit_id,
    p_raw, 0, 'C2B confirmation received'
  )
  on conflict (transaction_id) where transaction_id is not null
  do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    select p.id, p.matched_tenant_id, p.matched_unit_id
      into v_payment_id, v_tenant_id, v_unit_id
    from public.payments p
    where p.transaction_id = p_transaction_id
    limit 1;

    payment_id        := v_payment_id;
    was_duplicate     := true;
    matched_tenant_id := v_tenant_id;
    matched_unit_id   := v_unit_id;
    return next;
    return;
  end if;

  if v_match.tenant_id is not null then
    select p.id into v_twin_id
    from public.payments p
    where p.source = 'stk'
      and p.matched_tenant_id is not distinct from v_match.tenant_id
      and round(p.amount) = round(p_amount)
      and p.paired_payment_id is null
      and p.id <> v_payment_id
      and p.created_at >= v_created_at - interval '10 minutes'
    order by p.created_at desc
    limit 1;

    if v_twin_id is null then
      select p.id into v_twin_id
      from public.payments p
      where p.source = 'stk'
        and p.matched_tenant_id is null
        and p.msisdn is not distinct from p_msisdn
        and round(p.amount) = round(p_amount)
        and p.paired_payment_id is null
        and p.id <> v_payment_id
        and p.created_at >= v_created_at - interval '10 minutes'
      order by p.created_at desc
      limit 1;
    end if;

    if v_twin_id is not null then
      update public.payments set paired_payment_id = v_twin_id    where id = v_payment_id;
      update public.payments set paired_payment_id = v_payment_id where id = v_twin_id;
    end if;

    update public.tenants t
       set payment_history = jsonb_build_array(
             jsonb_build_object(
               'date',      to_char(v_created_at, 'YYYY-MM-DD'),
               'amount',    'KES ' || to_char(p_amount, 'FM999,999,999,990'),
               'status',    'Paid',
               'method',    'M-Pesa (C2B)',
               'reference', p_transaction_id
             )
           ) || coalesce(t.payment_history, '[]'::jsonb),
           updated_at = now()
     where t.id = v_match.tenant_id;
  end if;

  payment_id        := v_payment_id;
  was_duplicate     := false;
  matched_tenant_id := v_match.tenant_id;
  matched_unit_id   := v_match.unit_id;
  return next;
end;
$func$;

grant execute on function public.record_c2b_payment(
  text, numeric, text, text, text, text, text, text, numeric, jsonb, text
) to service_role, authenticated;
