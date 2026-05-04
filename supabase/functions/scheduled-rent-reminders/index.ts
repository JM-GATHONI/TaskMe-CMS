/**
 * scheduled-rent-reminders — Automated rent SMS dispatcher
 *
 * Triggered by pg_cron (see migration 0078_rent_reminder_cron.sql).
 * Can also be called manually via POST for testing.
 *
 * Logic:
 *   Day 25 (at 16:00 EAT): Upcoming rent reminder  → template id: sms-rent-25th
 *   Day  1 (at 09:00 EAT): Rent due today          → template id: sms-rent-1st
 *   Day  5 (at 09:00 EAT): Last day to pay         → template id: sms-rent-5th
 *   Day  7 (at 09:00 EAT): Arrears & fines notice  → template id: sms-rent-7th
 *
 * Only sends to tenants who have NOT paid rent for the current month.
 * Respects the bulkSmsEnabled flag in system settings.
 *
 * Required env vars (shared with send-sms):
 *   SMS_PROVIDER=onfonmedia
 *   ONFON_ACCESS_KEY, ONFON_API_KEY, ONFON_CLIENT_ID
 *   ONFON_SENDER_ID=TASK-ME  (optional)
 *
 * Supabase env vars (auto-injected):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DAY_TEMPLATE_MAP: Record<number, string> = {
  25: 'sms-rent-25th',
  1:  'sms-rent-1st',
  5:  'sms-rent-5th',
  7:  'sms-rent-7th',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/** Replace {placeholder} tokens in a template string */
function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/** Determine if a tenant has paid rent in the given month (YYYY-MM) */
function hasPaidThisMonth(tenant: any, monthIso: string): boolean {
  const history: any[] = tenant.paymentHistory || [];
  return history.some(
    (p: any) =>
      typeof p.date === 'string' &&
      p.date.startsWith(monthIso) &&
      p.status === 'Paid'
  );
}

/** Send one SMS via OnfonMedia */
async function sendOnfonSms(
  to: string,
  text: string,
  env: Record<string, string>
): Promise<{ ok: boolean; msgId?: string; error?: string }> {
  const accessKey = env.ONFON_ACCESS_KEY;
  const apiKey    = env.ONFON_API_KEY;
  const clientId  = env.ONFON_CLIENT_ID;
  const senderId  = env.ONFON_SENDER_ID || 'TASK-ME';

  if (!accessKey || !apiKey || !clientId) {
    return { ok: false, error: 'OnfonMedia env vars not configured' };
  }

  try {
    const res = await fetch('https://api.onfonmedia.co.ke/v1/sms/SendBulkSMS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'AccessKey': accessKey },
      body: JSON.stringify({
        SenderId: senderId,
        MessageParameters: [{ Number: to, Text: text }],
        ApiKey: apiKey,
        ClientId: clientId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (data as any)?.ErrorMessage || `HTTP ${res.status}` };
    }
    const msgId = (data as any)?.MessageId || (data as any)?.Data?.[0]?.MessageId;
    return { ok: true, msgId: String(msgId ?? Date.now()) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const env = Deno.env.toObject();

  // Allow optional override of day (for manual testing)
  let body: { day?: number } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  // EAT = UTC+3
  const nowUtc = new Date();
  const nowEat = new Date(nowUtc.getTime() + 3 * 60 * 60 * 1000);
  const dayOfMonth: number = body.day ?? nowEat.getUTCDate();
  const monthIso = `${nowEat.getUTCFullYear()}-${String(nowEat.getUTCMonth() + 1).padStart(2, '0')}`;

  const templateId = DAY_TEMPLATE_MAP[dayOfMonth];
  if (!templateId) {
    return json(200, { message: `No reminder scheduled for day ${dayOfMonth}. Skipping.` });
  }

  // Connect to Supabase
  const supabaseUrl  = env.SUPABASE_URL;
  const serviceKey   = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set' });
  }
  const db = createClient(supabaseUrl, serviceKey);

  // Pull system settings
  const { data: settingsRow } = await db
    .schema('app')
    .from('app_state')
    .select('value')
    .eq('key', 'tm_system_settings_v11')
    .maybeSingle();

  const settings: any = settingsRow?.value ?? {};
  if (!settings.bulkSmsEnabled) {
    return json(200, { message: 'Bulk SMS is disabled in system settings. Skipping.' });
  }

  const paybill  = settings.shortcode || settings.agencyPaybill || '';
  const provider = (env.SMS_PROVIDER || '').toLowerCase();
  if (provider !== 'onfonmedia') {
    return json(200, { message: `SMS_PROVIDER is '${provider}'. Only onfonmedia is supported for scheduled sends.` });
  }

  // Pull template content
  const { data: templatesRow } = await db
    .schema('app')
    .from('app_state')
    .select('value')
    .eq('key', 'tm_templates_v11')
    .maybeSingle();

  const templates: any[] = Array.isArray(templatesRow?.value) ? templatesRow.value : [];
  const template = templates.find((t: any) => t.id === templateId);
  if (!template?.content) {
    return json(500, { error: `Template '${templateId}' not found in app_state. Visit Operations > Communications > Templates to seed it.` });
  }

  // Pull tenants
  const { data: tenantsRow } = await db
    .schema('app')
    .from('app_state')
    .select('value')
    .eq('key', 'tm_tenants_v11')
    .maybeSingle();

  const allTenants: any[] = Array.isArray(tenantsRow?.value) ? tenantsRow.value : [];

  // Filter: active tenants who haven't paid this month
  const unpaidTenants = allTenants.filter((t: any) => {
    if (!['Active', 'Overdue', 'Notice'].includes(t.status)) return false;
    if (!t.phone) return false;
    return !hasPaidThisMonth(t, monthIso);
  });

  if (unpaidTenants.length === 0) {
    return json(200, { message: `All tenants have paid for ${monthIso}. No messages sent.` });
  }

  // Send SMS to each unpaid tenant
  const results: { name: string; phone: string; ok: boolean; error?: string }[] = [];

  for (const tenant of unpaidTenants) {
    const rentBalance = Number(tenant.rentAmount ?? 0);
    const fines = (tenant.outstandingFines ?? [])
      .filter((f: any) => f.status === 'Pending')
      .reduce((sum: number, f: any) => sum + Number(f.amount ?? 0), 0);
    const totalDue = rentBalance + fines;

    const vars: Record<string, string> = {
      name:         tenant.name || 'Tenant',
      unit:         tenant.unit || '',
      amount:       rentBalance.toLocaleString(),
      rent_balance: rentBalance.toLocaleString(),
      fines:        fines.toLocaleString(),
      total_due:    totalDue.toLocaleString(),
      paybill:      paybill,
      account:      tenant.unit || tenant.id || '',
    };

    const smsText = renderTemplate(template.content, vars);
    const result = await sendOnfonSms(tenant.phone, smsText, env);
    results.push({ name: tenant.name, phone: tenant.phone, ok: result.ok, error: result.error });
  }

  const sent  = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  console.log(`[scheduled-rent-reminders] Day ${dayOfMonth} | Template: ${templateId} | Sent: ${sent} | Failed: ${failed}`);

  return json(200, {
    day: dayOfMonth,
    templateId,
    monthIso,
    totalUnpaid: unpaidTenants.length,
    sent,
    failed,
    results,
  });
});
