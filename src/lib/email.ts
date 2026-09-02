const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

/** Escapes text before it goes into an HTML email body (subject/name/message fields are user input). */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Wraps a plain-text-ish body in a simple, professional-looking card layout.
 * Inline styles only - email clients strip <style> blocks and don't support
 * Tailwind classes, so this can't reuse the app's usual styling approach.
 */
export function renderBrandedEmail(params: {
  heading: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const { heading, bodyHtml, ctaText, ctaUrl } = params;
  return `
<div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0d9488;padding:20px 24px;">
      <span style="color:#ffffff;font-size:16px;font-weight:600;">MedSwyft</span>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 12px;font-size:18px;color:#0f172a;">${escapeHtml(heading)}</h1>
      <div style="font-size:14px;line-height:1.6;color:#334155;">${bodyHtml}</div>
      ${
        ctaText && ctaUrl
          ? `<div style="margin-top:20px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;font-weight:600;">${escapeHtml(ctaText)}</a>
      </div>`
          : ""
      }
    </div>
    <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">This message was sent by MedSwyft on behalf of your healthcare provider.</p>
    </div>
  </div>
</div>`.trim();
}

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
