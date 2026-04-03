/**
 * receive-lead — Webhook endpoint for your website to POST new leads
 *
 * Usage: Configure your website to POST to this endpoint when a user submits
 * a contact/inquiry form.
 *
 * Endpoint: POST /functions/v1/receive-lead
 *
 * Request body (JSON):
 * {
 *   tenantName: string;      // Required — full name of the lead
 *   contact?: string;        // Phone number
 *   email?: string;          // Email address
 *   interest?: string;       // What they're interested in (e.g. "3-bed in Westlands")
 *   listingTitle?: string;   // Listing they enquired about
 *   source?: string;         // "Website" | "Walk-in" | "Referral" | "Social Media"
 *   notes?: string;          // Additional message from the form
 *   referrerId?: string;     // Optional referral ID
 * }
 *
 * Response:
 * { ok: true, id: string }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: missing Supabase env vars' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { tenantName, contact, email, interest, listingTitle, source, notes, referrerId } = body;

  if (!tenantName || typeof tenantName !== 'string' || !tenantName.trim()) {
    return new Response(JSON.stringify({ error: 'Missing required field: tenantName' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Load existing leads from app_state
  const { data: stateRow, error: readError } = await supabase
    .schema('app')
    .from('app_state')
    .select('value')
    .eq('key', 'tm_leads_v11')
    .maybeSingle();

  if (readError) {
    console.error('[receive-lead] Failed to read app_state:', readError);
    return new Response(JSON.stringify({ error: 'Failed to read leads state' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const existingLeads: any[] = Array.isArray(stateRow?.value) ? stateRow.value : [];

  const newLead = {
    id: `lead-web-${Date.now()}`,
    tenantName: tenantName.trim(),
    status: 'New',
    assignedAgent: '',
    listingTitle: listingTitle || 'Website Enquiry',
    contact: contact || '',
    email: email || '',
    interest: interest || '',
    date: new Date().toISOString().split('T')[0],
    source: source || 'Website',
    notes: notes || '',
    referrerId: referrerId || '',
  };

  const updatedLeads = [newLead, ...existingLeads];

  const { error: writeError } = await supabase
    .schema('app')
    .from('app_state')
    .upsert({ key: 'tm_leads_v11', value: updatedLeads });

  if (writeError) {
    console.error('[receive-lead] Failed to write lead:', writeError);
    return new Response(JSON.stringify({ error: 'Failed to save lead' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`[receive-lead] New lead received: ${newLead.id} — ${newLead.tenantName}`);
  return new Response(JSON.stringify({ ok: true, id: newLead.id }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
