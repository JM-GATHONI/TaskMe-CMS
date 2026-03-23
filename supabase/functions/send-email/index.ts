// supabase/functions/send-email/index.ts
// Sends email using Resend. Called by the frontend via `supabase.functions.invoke('send-email', ...)`.

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

type SendEmailRequest = {
  to: string;
  subject: string;
  html: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { RESEND_API_KEY, RESEND_FROM_EMAIL } = Deno.env.toObject();

    if (!RESEND_API_KEY) return json(500, { error: "RESEND_API_KEY is missing" });
    if (!RESEND_FROM_EMAIL) return json(500, { error: "RESEND_FROM_EMAIL is missing" });

    const body = (await req.json().catch(() => null)) as Partial<SendEmailRequest> | null;
    if (!body) return json(400, { error: "Invalid JSON body" });

    const to = String(body.to ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const html = String(body.html ?? "").trim();

    if (!to) return json(400, { error: "`to` is required" });
    if (!subject) return json(400, { error: "`subject` is required" });
    if (!html) return json(400, { error: "`html` is required" });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    const resendJson = (await resendRes.json().catch(() => ({}))) as any;

    if (!resendRes.ok) {
      return json(502, {
        error: "Resend send failed",
        details: resendJson,
      });
    }

    const messageId = resendJson?.id ?? resendJson?.messageId ?? null;

    return json(200, {
      success: true,
      messageId,
      providerRef: messageId ?? undefined,
    });
  } catch (e) {
    return json(500, { error: (e as Error)?.message ?? "Unknown error" });
  }
});

