// supabase/functions/mpesa-callback/index.ts
// Handles Safaricom STK callback and updates payment row.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { error: "Supabase env vars missing" });
    }

    const payload = await req.json().catch(() => null) as any;
    const cb = payload?.Body?.stkCallback;
    if (!cb) return json(400, { error: "Invalid callback payload" });

    const checkoutRequestId = String(cb.CheckoutRequestID ?? "").trim();
    if (!checkoutRequestId) return json(400, { error: "Missing CheckoutRequestID" });

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
      return json(500, { error: "Failed to update payment record", details: updateErr.message });
    }

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: (e as Error)?.message ?? "Unknown error" });
  }
});

