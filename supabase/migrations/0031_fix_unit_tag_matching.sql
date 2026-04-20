-- supabase/migrations/0031_fix_unit_tag_matching.sql
--
-- Problem: find_active_tenant_by_unit_tag only matched units that have an
-- explicit `unitTag` field in the properties.units JSONB. When a unit was
-- created without a unitTag (but with a name like "INCA/13"), C2B payments
-- whose BillRefNumber = "INCA/13" were never reconciled even though the front-
-- end correctly displayed "INCA/13" as the Payment Account (via the tenant.unit
-- fallback). The two sides were disconnected.
--
-- Fix: extend matching to three tiers, tried in order, stopping at first hit:
--   1. u->>'unitTag'  — dedicated Safaricom account reference (existing logic)
--   2. u->>'name'     — unit name field in the properties.units JSONB
--   3. tenants.unit   — the unit name stored on the tenant row directly
--
-- Also fix: previously only 'Active' tenants were matched; Overdue tenants
-- should be matched too so their payments are auto-reconciled.

create or replace function public.find_active_tenant_by_unit_tag(p_tag text)
returns table (
  property_id text,
  unit_id     text,
  unit_tag    text,
  tenant_id   text,
  tenant_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  -- Tier 1: match via unitTag in properties.units JSONB (exact purpose-built field).
  select
    p.id                as property_id,
    u->>'id'            as unit_id,
    u->>'unitTag'       as unit_tag,
    t.id                as tenant_id,
    t.name              as tenant_name
  into v_row
  from public.properties p,
       jsonb_array_elements(coalesce(p.units, '[]'::jsonb)) u
  left join public.tenants t
         on t.unit_id = u->>'id'
        and t.status in ('Active', 'Overdue')
  where upper(btrim(u->>'unitTag')) = upper(btrim(p_tag))
  limit 1;

  if found and v_row.property_id is not null then
    property_id := v_row.property_id;
    unit_id     := v_row.unit_id;
    unit_tag    := v_row.unit_tag;
    tenant_id   := v_row.tenant_id;
    tenant_name := v_row.tenant_name;
    return next;
    return;
  end if;

  -- Tier 2: match via unit name field (u->>'name') in properties.units JSONB.
  select
    p.id                as property_id,
    u->>'id'            as unit_id,
    u->>'name'          as unit_tag,
    t.id                as tenant_id,
    t.name              as tenant_name
  into v_row
  from public.properties p,
       jsonb_array_elements(coalesce(p.units, '[]'::jsonb)) u
  left join public.tenants t
         on t.unit_id = u->>'id'
        and t.status in ('Active', 'Overdue')
  where upper(btrim(u->>'name')) = upper(btrim(p_tag))
    and (u->>'unitTag' is null or btrim(u->>'unitTag') = '')
  limit 1;

  if found and v_row.property_id is not null then
    property_id := v_row.property_id;
    unit_id     := v_row.unit_id;
    unit_tag    := v_row.unit_tag;
    tenant_id   := v_row.tenant_id;
    tenant_name := v_row.tenant_name;
    return next;
    return;
  end if;

  -- Tier 3: match directly against tenants.unit column (what the UI displays
  -- as Payment Account when no unitTag is set on the unit object).
  select
    t.property_id,
    t.unit_id,
    t.unit      as unit_tag,
    t.id        as tenant_id,
    t.name      as tenant_name
  into v_row
  from public.tenants t
  where upper(btrim(t.unit)) = upper(btrim(p_tag))
    and t.status in ('Active', 'Overdue')
  limit 1;

  if found and v_row.property_id is not null then
    property_id := v_row.property_id;
    unit_id     := v_row.unit_id;
    unit_tag    := v_row.unit_tag;
    tenant_id   := v_row.tenant_id;
    tenant_name := v_row.tenant_name;
    return next;
  end if;
end;
$$;

grant execute on function public.find_active_tenant_by_unit_tag(text)
  to anon, authenticated, service_role;
