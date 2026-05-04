/**
 * send-sms — Provider-agnostic SMS Edge Function
 *
 * Supported providers (set SMS_PROVIDER env var):
 *   "onfonmedia"      → OnfonMedia (primary — https://api.onfonmedia.co.ke)
 *   "africastalking"  → Africa's Talking
 *   "twilio"          → Twilio
 *   (unset/other)     → Logs the message and returns a queued response
 *
 * Required env vars per provider:
 *
 * OnfonMedia (recommended):
 *   SMS_PROVIDER=onfonmedia
 *   ONFON_ACCESS_KEY=<your-access-key>
 *   ONFON_API_KEY=<your-api-key>
 *   ONFON_CLIENT_ID=<your-client-id>
 *   ONFON_SENDER_ID=TASK-ME             (optional, defaults to TASK-ME)
 *
 * Africa's Talking:
 *   SMS_PROVIDER=africastalking
 *   AT_API_KEY=<your-api-key>
 *   AT_USERNAME=<your-username>          (default: "sandbox" for testing)
 *   AT_SENDER_ID=<optional-sender-id>
 *
 * Twilio:
 *   SMS_PROVIDER=twilio
 *   TWILIO_ACCOUNT_SID=<your-account-sid>
 *   TWILIO_AUTH_TOKEN=<your-auth-token>
 *   TWILIO_FROM_NUMBER=<e.g. +1234567890>
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

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
    ...(ao && ao !== "*" ? { Vary: "Origin" } : {}),
  };
}

serve(async (req: Request) => {
  const cors = buildCors(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });

  let body: { to: string; content: string; senderId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const { to, content, senderId } = body;
  if (!to || !content) {
    return new Response(JSON.stringify({ error: 'Missing required fields: to, content' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const env = Deno.env.toObject();
  const provider = (env.SMS_PROVIDER || '').toLowerCase();

  try {
    // ── OnfonMedia ────────────────────────────────────────────────────────────
    if (provider === 'onfonmedia') {
      const accessKey = env.ONFON_ACCESS_KEY;
      const apiKey    = env.ONFON_API_KEY;
      const clientId  = env.ONFON_CLIENT_ID;
      const senderIdEnv = env.ONFON_SENDER_ID || 'TASK-ME';
      const effectiveSenderId = senderId || senderIdEnv;

      if (!accessKey || !apiKey || !clientId) {
        return new Response(JSON.stringify({ error: 'OnfonMedia env vars not configured (ONFON_ACCESS_KEY, ONFON_API_KEY, ONFON_CLIENT_ID)' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      const onfonPayload = {
        SenderId: effectiveSenderId,
        MessageParameters: [{ Number: to, Text: content }],
        ApiKey: apiKey,
        ClientId: clientId,
      };

      const onfonRes = await fetch('https://api.onfonmedia.co.ke/v1/sms/SendBulkSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AccessKey': accessKey,
        },
        body: JSON.stringify(onfonPayload),
      });

      const onfonJson = await onfonRes.json().catch(() => ({}));

      if (!onfonRes.ok) {
        const errMsg = (onfonJson as any)?.ErrorMessage || (onfonJson as any)?.message || `OnfonMedia HTTP ${onfonRes.status}`;
        console.error('[send-sms OnfonMedia] Error:', errMsg);
        return new Response(JSON.stringify({ error: errMsg }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      const msgId = (onfonJson as any)?.MessageId || (onfonJson as any)?.Data?.[0]?.MessageId || `onfon-${Date.now()}`;
      return new Response(JSON.stringify({
        success: true,
        messageId: String(msgId),
        providerRef: `ONFON-${msgId}`,
        provider: 'onfonmedia',
      }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── Africa's Talking ──────────────────────────────────────────────────────
    if (provider === 'africastalking') {
      const apiKey = env.AT_API_KEY;
      const username = env.AT_USERNAME || 'sandbox';
      const from = senderId || env.AT_SENDER_ID || undefined;

      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'AT_API_KEY not configured' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      const params = new URLSearchParams({ username, to, message: content });
      if (from) params.append('from', from);

      const atRes = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': apiKey,
        },
        body: params.toString(),
      });

      const atJson = await atRes.json();

      if (!atRes.ok || atJson.SMSMessageData?.Recipients?.[0]?.status !== 'Success') {
        const errMsg = atJson.SMSMessageData?.Recipients?.[0]?.status || atJson.error || 'Africa\'s Talking send failed';
        console.error('[send-sms AT] Error:', errMsg);
        return new Response(JSON.stringify({ error: errMsg }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      const recipient = atJson.SMSMessageData.Recipients[0];
      return new Response(JSON.stringify({
        success: true,
        messageId: recipient.messageId,
        providerRef: `AT-${recipient.messageId}`,
        provider: 'africastalking',
      }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── Twilio ────────────────────────────────────────────────────────────────
    if (provider === 'twilio') {
      const accountSid = env.TWILIO_ACCOUNT_SID;
      const authToken = env.TWILIO_AUTH_TOKEN;
      const from = env.TWILIO_FROM_NUMBER;

      if (!accountSid || !authToken || !from) {
        return new Response(JSON.stringify({ error: 'Twilio env vars not fully configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: from, Body: content }).toString(),
        }
      );

      const twilioJson = await twilioRes.json();

      if (!twilioRes.ok) {
        console.error('[send-sms Twilio] Error:', twilioJson.message);
        return new Response(JSON.stringify({ error: twilioJson.message || 'Twilio send failed' }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        success: true,
        messageId: twilioJson.sid,
        providerRef: `TWILIO-${twilioJson.sid}`,
        provider: 'twilio',
      }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── No provider configured — queue/log mode ───────────────────────────────
    console.log(`[send-sms] No SMS_PROVIDER configured. Message queued.`);
    return new Response(JSON.stringify({
      success: true,
      messageId: `sms-queued-${Date.now()}`,
      providerRef: 'queued',
      provider: 'none',
      note: 'Set SMS_PROVIDER env var (onfonmedia, africastalking or twilio) to enable real delivery.',
    }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('[send-sms] Unexpected error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
