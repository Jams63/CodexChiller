/**
 * WhatsApp sending via either Twilio's WhatsApp API or Meta's Cloud API.
 * Both are plain HTTPS POSTs, so no SDK dependency is needed.
 *
 * Select the provider with WHATSAPP_PROVIDER=twilio|meta. When unset,
 * sending is disabled and messages are logged instead (safe default).
 *
 * NOTE (Meta Cloud API): outside a 24h customer-service window you must use
 * a pre-approved template message. The free-form "text" payload below works
 * for sandbox/testing and within open sessions; register a template
 * (e.g. "new_jobs_alert") for production alerts.
 */

export interface SendResult {
  ok: boolean;
  provider: string;
  detail?: string;
}

export async function sendWhatsApp(toE164: string, body: string): Promise<SendResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "";

  if (provider === "twilio") return sendViaTwilio(toE164, body);
  if (provider === "meta") return sendViaMeta(toE164, body);

  console.log(`[whatsapp:disabled] would send to ${toE164}:\n${body}`);
  return { ok: true, provider: "disabled" };
}

async function sendViaTwilio(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886
  if (!sid || !token || !from) {
    return { ok: false, provider: "twilio", detail: "missing TWILIO_* env vars" };
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: `whatsapp:${to}`, Body: body }),
      signal: AbortSignal.timeout(15_000),
    }
  );
  if (!res.ok) {
    return { ok: false, provider: "twilio", detail: `HTTP ${res.status}: ${await res.text()}` };
  }
  return { ok: true, provider: "twilio" };
}

async function sendViaMeta(to: string, body: string): Promise<SendResult> {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WA_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    return { ok: false, provider: "meta", detail: "missing META_WA_* env vars" };
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/^\+/, ""),
        type: "text",
        text: { body },
      }),
      signal: AbortSignal.timeout(15_000),
    }
  );
  if (!res.ok) {
    return { ok: false, provider: "meta", detail: `HTTP ${res.status}: ${await res.text()}` };
  }
  return { ok: true, provider: "meta" };
}
