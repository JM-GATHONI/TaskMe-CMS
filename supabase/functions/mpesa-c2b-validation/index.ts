// supabase/functions/mpesa-c2b-validation/index.ts
//
// C2B Validation URL.
//
// Called by Safaricom BEFORE the payment is debited from the customer's
// wallet. We use an "accept-all" policy:
//   * always respond 200 with { ResultCode: 0, ResultDesc: "Accepted" }
//   * unknown/wrong BillRefNumber is handled downstream in the
//     confirmation endpoint and the Reconciliation → External Unmatched
//     queue.
//
// Rationale: rejecting at validation stops the customer at the till with a
// cryptic "C2B00012" error. That is worse UX than letting the payment go
// through and reconciling manually — especially during tenant onboarding
// when the unit tag may not yet be in the DB.
//
// Hardening:
//   * Restrict to Safaricom's published IP ranges (shared with mpesa-callback).
//   * Log the raw payload so unmatched tags can be debugged.
//   * Always return 200 to Safaricom (their docs treat non-200 as retryable).

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
      console.warn(`[mpesa-c2b-validation] rejected IP: ${ip}`);
      // Respond 200 with Rejected so Safaricom does not retry; we just drop it.
      return json(200, { ResultCode: "C2B00016", ResultDesc: "Rejected" });
    }
  }

  const payload = await req.json().catch(() => null) as Record<string, unknown> | null;
  console.log("[mpesa-c2b-validation] payload:", JSON.stringify(payload));

  // Best-effort: log unknown bill refs to help admins spot typos in customer
  // messaging. This is non-blocking — we still accept the payment.
  try {
    const billRef = String((payload as any)?.BillRefNumber ?? "").trim();
    if (billRef) {
      const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data } = await sb.rpc("find_active_tenant_by_unit_tag", { p_tag: billRef });
        const match = Array.isArray(data) ? data[0] : data;
        if (!match?.unit_id) {
          console.warn(`[mpesa-c2b-validation] no unit matches BillRefNumber="${billRef}" — will land in External Unmatched`);
        }
      }
    }
  } catch (e) {
    console.warn("[mpesa-c2b-validation] lookup warning:", (e as Error)?.message);
  }

  return json(200, { ResultCode: 0, ResultDesc: "Accepted" });
});
