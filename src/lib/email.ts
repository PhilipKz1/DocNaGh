const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

/**
 * Best-effort transactional email via Resend's REST API. Deliberately never
 * throws - a notification failing to send must never break the upload flow
 * it's reporting on. Until RESEND_API_KEY is set (see .env.local.example)
 * this just logs instead of sending, so the app works in dev without it.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set - skipped "${params.subject}" to ${params.to}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      console.error(`[email] send failed (${res.status}) to ${params.to}: ${await res.text()}`);
    }
  } catch (err) {
    console.error(`[email] send threw for ${params.to}`, err);
  }
}
