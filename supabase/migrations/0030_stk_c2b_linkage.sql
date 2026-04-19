-- supabase/migrations/0030_stk_c2b_linkage.sql
--
-- Collapse the two events that represent the same tenant payment into a
-- single Inbound row:
--
--   1. STK Push initiated from the CMS → mpesa-stk-push inserts a row with
--      source='stk', status='pending', bill_ref_number=<unit_tag>, msisdn=<phone>.
--      Later mpesa-callback marks it status='completed' with the MpesaReceiptNumber.
--
--   2. When the customer completes the prompt, Safaricom also relays the
--      payment as a paybill C2B confirmation → mpesa-c2b-confirmation calls
--      record_c2b_payment which inserts a second row with source='c2b',
--      same transaction_id, same amount, same msisdn.
--
-- Today these two rows look like separate payments on the Inbound list.
-- This migration adds a self-referencing link column and teaches
-- record_c2b_payment to find the preceding STK row and pair them.

-- ── 1. paired_payment_id: link the STK ↔ C2B twin rows ─────────────────────
alter table public.payments
  add column if not exists paired_payment_id uuid
    references public.payments(id) on delete set null;

create index if not exists payments_paired_idx
  on public.payments(paired_payment_id)
  where paired_payment_id is not null;


-- ── 2. Rebuild record_c2b_payment with STK pairing ─────────────────────────
-- Behavior:
--   • Dedup by transaction_id (same as before).
--   • Match BillRefNumber → unit → tenant (same as before).
--   • NEW: If an STK row with the same transaction_id exists (because
--     mpesa-callback already wrote MpesaReceiptNumber into a pending STK
--     row), do NOT insert a second row — this is the common case when a
--     customer completes the STK prompt and Safaricom also relays it as
--     a paybill. We mark the STK row with the unit-tag match metadata
--     and return its id with was_duplicate=true.
--   • If no STK twin exists (pure paybill deposit), insert a new C2B row
--     and, if a recent matching STK pending/completed row is found within
--     10 minutes for the same tenant + amount, set paired_payment_id on
--     both rows so the UI can collapse them.

create or replace function public.record_c2b_payment(
  p_transaction_id text,
  p_amount numeric,
  p_msisdn text,
  p_bill_ref text,
  p_business_short_code text,
  p_first_name text,
  p_middle_name text,
  p_last_name text,
  p_org_balance numeric,
  p_raw jsonb,
  p_trans_time text default null
)
returns table (
  payment_id uuid,
  was_duplicate boolean,
  matched_tenant_id text,
  matched_unit_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing record;
  v_payment_id uuid;
  v_match record;
  v_status text;
  v_created_at timestamptz := now();
  v_twin_id uuid;
begin
  -- Idempotency / STK-pairing: a row with the same transaction_id might
  -- already exist either because this is a duplicate Safaricom retry OR
  -- because mpesa-callback wrote the receipt number onto a pending STK
  -- row first. Either way, we don't want a second row.
  select id, matched_tenant_id, matched_unit_id, source
    into v_existing
  from public.payments
  where transaction_id = p_transaction_id
  limit 1;

  if v_existing.id is not null then
    -- Attempt to resolve the bill ref match so the tenant ledger gets
    -- updated even if the preceding STK row had no matched_tenant (e.g.
    -- AccountReference wasn't the unit tag).
    select *
      into v_match
    from public.find_active_tenant_by_unit_tag(p_bill_ref);

    -- Mirror C2B metadata onto the STK row — this preserves BillRefNumber,
    -- names, business_short_code for the reconciliation page without
    -- creating a duplicate Inbound row.
    update public.payments
       set bill_ref_number = coalesce(bill_ref_number, p_bill_ref),
           msisdn = coalesce(msisdn, p_msisdn),
           first_name = coalesce(first_name, p_first_name),
           middle_name = coalesce(middle_name, p_middle_name),
           last_name = coalesce(last_name, p_last_name),
           business_short_code = coalesce(business_short_code, p_business_short_code),
           org_account_balance = coalesce(org_account_balance, p_org_balance),
           matched_tenant_id = coalesce(matched_tenant_id, v_match.tenant_id),
           matched_unit_id = coalesce(matched_unit_id, v_match.unit_id),
           reconciliation_status = case
             when coalesce(matched_tenant_id, v_match.tenant_id) is not null then 'reconciled'
             else coalesce(reconciliation_status, 'unreconciled')
           end,
           raw_payload = coalesce(raw_payload, p_raw),
           updated_at = now()
     where id = v_existing.id;

    -- Append to tenant ledger only if it wasn't already recorded by
    -- the STK callback path (legacy callback does not update the
    -- tenant ledger — that's done here via the C2B hook).
    if coalesce(v_existing.matched_tenant_id, v_match.tenant_id) is not null
       and not exists (
         select 1 from public.tenants t,
                jsonb_array_elements(coalesce(t.payment_history, '[]'::jsonb)) ph
          where t.id = coalesce(v_existing.matched_tenant_id, v_match.tenant_id)
            and ph->>'reference' = p_transaction_id
       )
    then
      update public.tenants
         set payment_history = (
               jsonb_build_array(
                 jsonb_build_object(
                   'date',      to_char(v_created_at, 'YYYY-MM-DD'),
                   'amount',    'KES ' || to_char(p_amount, 'FM999,999,999,990'),
                   'status',    'Paid',
                   'method',    'M-Pesa',
                   'reference', p_transaction_id
                 )
               ) || coalesce(payment_history, '[]'::jsonb)
             ),
             updated_at = now()
       where id = coalesce(v_existing.matched_tenant_id, v_match.tenant_id);
    end if;

    payment_id := v_existing.id;
    was_duplicate := true;
    matched_tenant_id := coalesce(v_existing.matched_tenant_id, v_match.tenant_id);
    matched_unit_id := coalesce(v_existing.matched_unit_id, v_match.unit_id);
    return next;
    return;
  end if;

  -- ── Pure C2B path: no pre-existing row for this TransID ──────────────────
  select *
    into v_match
  from public.find_active_tenant_by_unit_tag(p_bill_ref);

  v_status := case
    when v_match.tenant_id is not null then 'reconciled'
    else 'unreconciled'
  end;

  insert into public.payments (
    source,
    status,
    reconciliation_status,
    amount,
    transaction_id,
    bill_ref_number,
    msisdn,
    phone,
    business_short_code,
    first_name,
    middle_name,
    last_name,
    org_account_balance,
    matched_tenant_id,
    matched_unit_id,
    raw_payload,
    result_code,
    result_desc
  ) values (
    'c2b',
    'completed',
    v_status,
    p_amount,
    p_transaction_id,
    p_bill_ref,
    p_msisdn,
    p_msisdn,
    p_business_short_code,
    p_first_name,
    p_middle_name,
    p_last_name,
    p_org_balance,
    v_match.tenant_id,
    v_match.unit_id,
    p_raw,
    0,
    'C2B confirmation received'
  )
  on conflict (transaction_id) do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    -- Conflict raced with us — re-select.
    select id, matched_tenant_id, matched_unit_id
      into v_payment_id, matched_tenant_id, matched_unit_id
    from public.payments
    where transaction_id = p_transaction_id
    limit 1;

    payment_id := v_payment_id;
    was_duplicate := true;
    return next;
    return;
  end if;

  -- ── Pair with a recent STK row if one exists ─────────────────────────────
  -- Only pair when we have a matched tenant to avoid false positives across
  -- unrelated customers. The STK row must be within 10 minutes, for the same
  -- tenant, and the same amount (rounded to integer KES).
  if v_match.tenant_id is not null then
    select id
      into v_twin_id
    from public.payments
    where source = 'stk'
      and matched_tenant_id is not distinct from v_match.tenant_id
      and round(amount) = round(p_amount)
      and paired_payment_id is null
      and id <> v_payment_id
      and created_at >= v_created_at - interval '10 minutes'
    order by created_at desc
    limit 1;

    -- Fall back to msisdn match if the STK row was inserted before we had
    -- a tenant match (e.g. AccountReference was the legacy userId).
    if v_twin_id is null then
      select id
        into v_twin_id
      from public.payments
      where source = 'stk'
        and matched_tenant_id is null
        and msisdn is not distinct from p_msisdn
        and round(amount) = round(p_amount)
        and paired_payment_id is null
        and id <> v_payment_id
        and created_at >= v_created_at - interval '10 minutes'
      order by created_at desc
      limit 1;
    end if;

    if v_twin_id is not null then
      update public.payments set paired_payment_id = v_twin_id where id = v_payment_id;
      update public.payments set paired_payment_id = v_payment_id where id = v_twin_id;
    end if;

    -- Append to tenant payment_history.
    update public.tenants
       set payment_history = (
             jsonb_build_array(
               jsonb_build_object(
                 'date',      to_char(v_created_at, 'YYYY-MM-DD'),
                 'amount',    'KES ' || to_char(p_amount, 'FM999,999,999,990'),
                 'status',    'Paid',
                 'method',    'M-Pesa (C2B)',
                 'reference', p_transaction_id
               )
             ) || coalesce(payment_history, '[]'::jsonb)
           ),
           updated_at = now()
     where id = v_match.tenant_id;
  end if;

  payment_id := v_payment_id;
  was_duplicate := false;
  matched_tenant_id := v_match.tenant_id;
  matched_unit_id := v_match.unit_id;
  return next;
end;
$$;

grant execute on function public.record_c2b_payment(
  text, numeric, text, text, text, text, text, text, numeric, jsonb, text
) to service_role, authenticated;
