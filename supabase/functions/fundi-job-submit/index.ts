// supabase/functions/fundi-job-submit/index.ts
// Public endpoint for website job requests into Fundi Hub.
// Persists to app.app_state key "tm_fundi_jobs_v11" so the CMS "MyFundiHub" shows real data.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type FundiJobSubmitRequest = {
  fundiId: string;
  fundiName: string;
  clientName: string;
  clientPhone: string;
  location: string;
  description: string;
  amount?: number;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeText(v: unknown, max = 5000): string {
  return String(v ?? "").trim().slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { error: "Supabase env vars missing" });
    }

    const body = (await req.json().catch(() => null)) as FundiJobSubmitRequest | null;
    if (!body) return json(400, { error: "Invalid JSON body" });

    const fundiId = safeText(body.fundiId, 120);
    const fundiName = safeText(body.fundiName, 200);
    const clientName = safeText(body.clientName, 200);
    const clientPhone = safeText(body.clientPhone, 50);
    const location = safeText(body.location, 200);
    const description = safeText(body.description, 2000);
    const amount = body.amount === undefined ? undefined : Number(body.amount);

    if (!fundiId) return json(400, { error: "fundiId is required" });
    if (!fundiName) return json(400, { error: "fundiName is required" });
    if (!clientName) return json(400, { error: "clientName is required" });
    if (!clientPhone) return json(400, { error: "clientPhone is required" });
    if (!location) return json(400, { error: "location is required" });
    if (!description) return json(400, { error: "description is required" });
    if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
      return json(400, { error: "amount must be a positive number" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load existing list
    const { data: stateRow, error: readErr } = await supabase
      .schema("app")
      .from("app_state")
      .select("value")
      .eq("key", "tm_fundi_jobs_v11")
      .maybeSingle();

    if (readErr) return json(500, { error: "Failed to load fundi jobs state", details: readErr.message });

    const existing = (stateRow?.value ?? []) as any[];
    const nowIso = new Date().toISOString().split("T")[0];

    const newJob = {
      id: `web-job-${Date.now()}`,
      fundiId,
      fundiName,
      clientName,
      clientPhone,
      location,
      description,
      status: "Pending",
      date: nowIso,
      amount: amount ?? undefined,
      source: "Website",
    };

    const next = [newJob, ...(Array.isArray(existing) ? existing : [])];

    const { error: upsertErr } = await supabase
      .schema("app")
      .from("app_state")
      .upsert({ key: "tm_fundi_jobs_v11", value: next });

    if (upsertErr) return json(500, { error: "Failed to persist fundi job", details: upsertErr.message });

    return json(200, { ok: true, id: newJob.id });
  } catch (e) {
    return json(500, { error: (e as Error)?.message ?? "Unknown error" });
  }
});

