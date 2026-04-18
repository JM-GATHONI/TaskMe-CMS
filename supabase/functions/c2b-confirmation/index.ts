// supabase/functions/c2b-confirmation/index.ts
//
// C2B Confirmation URL — called by Safaricom AFTER the customer has been
// debited. This is the authoritative event that a payment happened.
//
// Responsibilities:
//   1. Validate the caller IP (Safaricom published ranges).
//   2. Parse the payload (TransID, TransAmount, BillRefNumber, MSISDN, names,
//      BusinessShortCode, OrgAccountBalance).
//   3. Call public.record_c2b_payment which:
//        * inserts the payment row (ON CONFLICT transaction_id DO NOTHING),
//        * resolves BillRefNumber → unit_tag → active tenant,
//        * appends to that tenant's payment_history when matched,
//        * leaves matched_tenant_id NULL for External Unmatched if not.
//   4. Always return 200 with { ResultCode: 0 } so Safaricom does not retry
//      (idempotency is enforced in the DB; retries are safe but noisy).
//
// Safaricom retries up to 5× on non-200 responses. Because the DB insert is
// idempotent on transaction_id, we never produce duplicate ledger entries.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SAFARICOM_IPS = new Set([
  "196.201.214.200",
  "196.201.214.206",
  "196.201.213.114",
  "196.201.214.207",
  "196.201.214.208",
  "196.201.213.44",
  "196.201.214.170",
  "196.201.214.176",
  "196.201.214.177",
  "196.201.214.167",
  "196.201.214.168",
  "196.201.214.195",
]);

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function resolveCallerIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? null;
}

type C2BPayload = {
  TransactionType?: string;
  TransID?: string;
  TransTime?: string;
  TransAmount?: string | number;
  BusinessShortCode?: string;
  BillRefNumber?: string;
  InvoiceNumber?: string;
  OrgAccountBalance?: string | number;
  ThirdPartyTransID?: string;
  MSISDN?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // IP check (can be disabled for sandbox via env var).
  const verifyIp = (Deno.env.get("MPESA_VERIFY_CALLBACK_IP") ?? "true") !== "false";
  if (verifyIp) {
    const ip = resolveCallerIp(req);
    if (!ip || !SAFARICOM_IPS.has(ip)) {
      console.warn(`[c2b-confirmation] rejected IP: ${ip}`);
      // Return 200 ok so Safaricom does not retry a request we intentionally dropped.
      return json(200, { ResultCode: 0, ResultDesc: "Ignored" });
    }
  }

  const payload = await req.json().catch(() => null) as C2BPayload | null;
  if (!payload) {
    console.warn("[c2b-confirmation] invalid JSON body");
    return json(200, { ResultCode: 0, ResultDesc: "Bad payload ignored" });
  }

  const transId = String(payload.TransID ?? "").trim();
  if (!transId) {
    console.warn("[c2b-confirmation] payload missing TransID:", JSON.stringify(payload));
    return json(200, { ResultCode: 0, ResultDesc: "Missing TransID ignored" });
  }

  const amount = Number(payload.TransAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    console.warn(`[c2b-confirmation] invalid TransAmount for ${transId}:`, payload.TransAmount);
    return json(200, { ResultCode: 0, ResultDesc: "Invalid amount ignored" });
  }

  const billRef = String(payload.BillRefNumber ?? "").trim();
  const msisdn = String(payload.MSISDN ?? "").trim() || null;
  const firstName = String(payload.FirstName ?? "").trim() || null;
  const middleName = String(payload.MiddleName ?? "").trim() || null;
  const lastName = String(payload.LastName ?? "").trim() || null;
  const shortcode = String(payload.BusinessShortCode ?? "").trim() || null;
  const orgBalance = payload.OrgAccountBalance !== undefined && payload.OrgAccountBalance !== ""
    ? Number(payload.OrgAccountBalance)
    : null;
  const transTime = String(payload.TransTime ?? "").trim() || null;

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[c2b-confirmation] Supabase env vars missing");
    // Return 500 so Safaricom retries — a genuine server misconfig, not a duplicate.
    return json(500, { ResultCode: 1, ResultDesc: "Server misconfigured" });
  }

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await sb.rpc("record_c2b_payment", {
      p_transaction_id: transId,
      p_amount: amount,
      p_msisdn: msisdn,
      p_bill_ref: billRef,
      p_business_short_code: shortcode,
      p_first_name: firstName,
      p_middle_name: middleName,
      p_last_name: lastName,
      p_org_balance: orgBalance,
      p_raw: payload as unknown as Record<string, unknown>,
      p_trans_time: transTime,
    });

    if (error) {
      console.error(`[c2b-confirmation] RPC error for ${transId}:`, error.message);
      // Return 500 so Safaricom retries — transient DB error.
      return json(500, { ResultCode: 1, ResultDesc: "DB error" });
    }

    const row = Array.isArray(data) ? data[0] : data;
    const matchedTenantId = row?.matched_tenant_id ?? null;
    const wasDuplicate = !!row?.was_duplicate;

    console.log(
      `[c2b-confirmation] ${transId} amount=${amount} billRef="${billRef}" ` +
      `matched=${matchedTenantId ? "yes" : "no"} duplicate=${wasDuplicate}`,
    );

    return json(200, { ResultCode: 0, ResultDesc: "Accepted" });
  } catch (e) {
    console.error(`[c2b-confirmation] unhandled error for ${transId}:`, (e as Error)?.message);
    return json(500, { ResultCode: 1, ResultDesc: "Internal server error" });
  }
});
