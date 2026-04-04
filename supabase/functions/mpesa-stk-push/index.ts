// supabase/functions/mpesa-stk-push/index.ts
// Initiates M-Pesa STK Push (Daraja) and inserts pending payment row.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type StkPushRequest = {
  phone: string;
  amount: number;
  leaseId?: string | null;
};

// CORS: set CORS_ALLOWED_ORIGINS env var to restrict origins (comma-separated).
// Leave unset (or '*') to allow all origins — lock this down in production.
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

function formatPhoneTo254(phoneRaw: string): string | null {
  const p = String(phoneRaw ?? "").trim().replace(/\s+/g, "");
  if (!p) return null;
  if (p.startsWith("+")) {
    const noPlus = p.slice(1);
    return noPlus.match(/^2547\d{8}$/) ? noPlus : null;
  }
  if (p.startsWith("254")) {
    return p.match(/^2547\d{8}$/) ? p : null;
  }
  if (p.startsWith("07") && p.length === 10) {
    return `254${p.slice(1)}`;
  }
  if (p.startsWith("7") && p.length === 9) {
    return `254${p}`;
  }
  return null;
}

function timestampNairobi(): string {
  // Daraja expects YYYYMMDDHHmmss in EAT (UTC+3). Compute by offsetting UTC time.
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

async function getOAuthToken(consumerKey: string, consumerSecret: string): Promise<string> {
  const basic = btoa(`${consumerKey}:${consumerSecret}`);
  const baseUrl = Deno.env.get("MPESA_BASE_URL") ||
    (Deno.env.get("MPESA_ENV") === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke");
  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OAuth token request failed (${res.status}): ${txt}`);
  }
  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error("OAuth token missing access_token");
  return data.access_token;
}

Deno.serve(async (req) => {
  const cors = buildCors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" }, cors);

  try {
    const {
      MPESA_CONSUMER_KEY,
      MPESA_CONSUMER_SECRET,
      MPESA_SHORTCODE,
      MPESA_PASSKEY,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    } = Deno.env.toObject();

    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY) {
      // Requirement: if Mpesa STK API is not enabled/missing keys, return this exact message.
      return json(500, { error: "Unable to trigger STK push due to missing Mpesa Api key" }, cors);
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { error: "Supabase env vars missing" }, cors);
    }

    // Verify caller identity — userId always comes from the verified JWT, never from the request body.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Authentication required" }, cors);
    }
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user: callerUser }, error: authErr } = await supabaseAuth.auth.getUser(
      authHeader.slice(7),
    );
    if (authErr || !callerUser) {
      return json(401, { error: "Invalid or expired token" }, cors);
    }
    const userId = callerUser.id;

    const body = (await req.json().catch(() => null)) as StkPushRequest | null;
    if (!body) return json(400, { error: "Invalid JSON body" }, cors);

    const phone = formatPhoneTo254(body.phone);
    const leaseId = body.leaseId ?? null;
    const amount = Number(body.amount ?? 0);

    if (!phone) return json(400, { error: "Invalid phone. Use 07XXXXXXXX, 2547XXXXXXXX or +2547XXXXXXXX" }, cors);
    if (!Number.isFinite(amount) || amount <= 0) return json(400, { error: "amount must be > 0" }, cors);

    const timestamp = timestampNairobi();
    const password = btoa(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`);
    const token = await getOAuthToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET);

    const stkPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `${SUPABASE_URL}/functions/v1/mpesa-callback`,
      AccountReference: leaseId ?? userId,
      TransactionDesc: "TaskMe Rent Payment",
    };

    const baseUrl = Deno.env.get("MPESA_BASE_URL") ||
      (Deno.env.get("MPESA_ENV") === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke");
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const stkJson = await stkRes.json().catch(() => ({} as any)) as any;
    if (!stkRes.ok) {
      return json(502, { error: "STK push request failed", details: stkJson }, cors);
    }

    const checkoutRequestId = String(stkJson.CheckoutRequestID ?? "").trim();
    if (!checkoutRequestId) {
      return json(502, { error: "STK push response missing CheckoutRequestID", details: stkJson }, cors);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: insertErr } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        lease_id: leaseId,
        amount: amount,
        phone: phone,
        checkout_request_id: checkoutRequestId,
        transaction_id: null,
        status: "pending",
        result_code: null,
        result_desc: null,
      });

    if (insertErr) {
      return json(500, { error: "Failed to insert payment record", details: insertErr.message }, cors);
    }

    return json(200, { checkoutRequestId }, cors);
  } catch (e) {
    return json(500, { error: (e as Error)?.message ?? "Unknown error" }, cors);
  }
});

