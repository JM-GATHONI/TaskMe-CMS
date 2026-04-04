// supabase/functions/mpesa-callback/index.ts
// Handles Safaricom STK callback and updates payment row.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS: set CORS_ALLOWED_ORIGINS env var to restrict origins (comma-separated).
// Note: mpesa-callback is called server-to-server by Safaricom; CORS headers are ignored by them.
const _CORS_RAW = Deno.env.get("CORS_ALLOWED_ORIGINS") ?? "*";
const _CORS_WILDCARD = _CORS_RAW === "*";
const _CORS_LIST = _CORS_WILDCARD ? [] : _CORS_RAW.split(",").map((s) => s.trim());
function buildCors(origin: string | null): Record<string, string> {
  const ao = _CORS_WILDCARD ? "*" : (origin && _CORS_LIST.includes(origin) ? origin : "");
  return {
    "Access-Control-Allow-Origin": ao,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...(ao && ao !== "*" ? { Vary: "Origin" } : {}),
  };
}

function json(status: number, body: unknown, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function extractMetadata(callbackMetadata: any): Record<string, unknown> {
  const items = callbackMetadata?.Item;
  const arr = Array.isArray(items) ? items : [];
  const out: Record<string, unknown> = {};
  for (const it of arr) {
    if (it?.Name) out[String(it.Name)] = it?.Value;
  }
  return out;
}

Deno.serve(async (req) => {
  const cors = buildCors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" }, cors);

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { error: "Supabase env vars missing" }, cors);
    }

    const payload = await req.json().catch(() => null) as any;
    const cb = payload?.Body?.stkCallback;
    if (!cb) return json(400, { error: "Invalid callback payload" }, cors);

    const checkoutRequestId = String(cb.CheckoutRequestID ?? "").trim();
    if (!checkoutRequestId) return json(400, { error: "Missing CheckoutRequestID" }, cors);

    const resultCode = typeof cb.ResultCode === "number" ? cb.ResultCode : Number(cb.ResultCode);
    const resultDesc = String(cb.ResultDesc ?? "");

    const meta = extractMetadata(cb.CallbackMetadata);
    const transactionId = (meta["MpesaReceiptNumber"] ? String(meta["MpesaReceiptNumber"]) : null);

    let status: "completed" | "failed" | "cancelled" = "failed";
    if (resultCode === 0) status = "completed";
    else if (resultCode === 1032) status = "cancelled"; // user cancelled

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: updateErr } = await supabase
      .from("payments")
      .update({
        status,
        transaction_id: transactionId,
        result_code: Number.isFinite(resultCode) ? resultCode : null,
        result_desc: resultDesc,
      })
      .eq("checkout_request_id", checkoutRequestId);

    if (updateErr) {
      return json(500, { error: "Failed to update payment record", details: updateErr.message }, cors);
    }

    return json(200, { ok: true }, cors);
  } catch (e) {
    return json(500, { error: (e as Error)?.message ?? "Unknown error" }, cors);
  }
});
