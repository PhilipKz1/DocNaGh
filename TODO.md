# TODO

## Blocking — nothing works end-to-end until these are done

- [x] Create a Supabase project and link it
- [x] Run `supabase/migrations/0001_init.sql` against it
- [x] Copy `.env.local.example` to `.env.local` and fill in real project URL / anon key / service role key
- [x] Apply `0002_admin.sql`, `0003_retention.sql`, `0004_document_deletion.sql`
- [x] Bootstrap the first platform admin (`p.kellllly@gmail.com`, via `/admin`)
- [x] Smoke test: login → create request → `/r/[token]` → upload → shows up in dashboard
- [ ] Regenerate `src/lib/supabase/database.types.ts` from the real project instead of the hand-written placeholder:
      `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts`

## Before deploying anywhere real

- [ ] **Rotate the Supabase service role key.** The current one was pasted directly into a chat session early in this project's setup and must be treated as exposed. Supabase Dashboard → Project Settings → API → regenerate `service_role`, then update `.env.local` and every deploy target's env vars. This key bypasses RLS entirely, so it's the single most important secret in the whole system.
- [ ] **Fix the Auth redirect allow-list.** Supabase Dashboard → Authentication → URL Configuration → Redirect URLs → add `http://localhost:3000/**` for dev and your real domain (`https://yourdomain.com/**`) once you have one. Without this, invite/recovery emails silently drop users on the homepage instead of `/reset-password`.
- [ ] **Set up custom SMTP** (Resend recommended — free tier, good deliverability). Supabase's built-in email sender is testing-only: low rate limits, poor deliverability, no branding. Configure in Supabase Dashboard → Project Settings → Authentication → SMTP Settings once you have a Resend account + verified sending domain.
- [ ] **Buy a domain** — needed for the SMTP sending-domain verification above, for `NEXT_PUBLIC_APP_URL`, and for the app itself to not live on a raw Vercel subdomain.
- [ ] Set `RESEND_API_KEY` (and optionally a verified-domain `EMAIL_FROM`) so the provider/patient upload-notification emails (`src/lib/email.ts`) actually send instead of just logging to the console.
- [ ] Set `CRON_SECRET` and `DOCUMENT_RETENTION_DAYS` in production env vars (Vercel project settings). `vercel.json` schedules the retention purge daily at 03:00 UTC once deployed there.
- [ ] Set `NEXT_PUBLIC_APP_URL` to the real `https://` production domain — currently `http://localhost:3000` in dev only.
- [x] Delete the leftover ad-hoc `provider@dropmy.test` test data

## Known gaps (called out in README, not yet built)

- [ ] Resumable/chunked uploads — currently a single signed upload URL per file, fine under the 100MB cap but not truly resumable; revisit with Supabase's TUS endpoint if needed
- [ ] Patient "missing documents" nudge / reminder flow (spec mentions tracking "which are missing" — status exists in schema but nothing acts on it yet)

## Security hardening not yet done

- [x] File content now verified against magic-number signatures (`src/lib/storage/fileSignature.ts`), not just the client-reported mimeType — a mislabeled/renamed file is rejected and deleted at confirm-upload time.
- [ ] **Next.js is 2 major versions behind (14.2.35, current is 16.3.2) with 5 high-severity CVEs** (`npm audit`): DoS, SSRF, cache poisoning, XSS. Fix is `npm audit fix --force`, which is a breaking major-version jump — deliberately not run yet; needs a dedicated upgrade-and-retest pass, not a blind `--force`.
- [ ] No rate limiting on the patient-facing token endpoints (`/r/[token]`, `/api/requests/[token]/*`). The token itself is 256 bits of entropy (effectively unguessable), so this is defense-in-depth rather than the primary control, but there's currently no protection against scripted abuse of a single known/leaked token either. Left out because in-memory rate limiting doesn't work reliably on serverless (stateless, multi-instance) — would need Upstash/Redis or similar if this becomes a real deployment target.
- [ ] `audit_events.metadata` stores the original `file_name` for `document_uploaded` indefinitely, even after the document itself is deleted/purged (retention only removes the `documents` row + storage object, not the audit trail). Fine for now since it's provider-only readable and filenames are rarely identifying on their own, but worth revisiting if audit retention needs its own policy later.

## Nice-to-haves from the spec

- [x] Patient-facing confirmation (email receipt) after successful upload — `notifyUploadReceived()` in the confirm-upload route; needs `RESEND_API_KEY` set to actually send (see above)
- [x] Provider notification when a patient uploads a document — same mechanism
- [ ] DICOM / large medical imaging support (explicitly deferred in the original spec)

## Housekeeping

- [ ] Decide on Node version — dev machine is on Node 18.18.2; `@supabase/supabase-js` warns it wants Node 22+, and `create-next-app@latest` needs Node 20.9+. Works fine today but will need an upgrade eventually.
- [ ] `npm audit` currently reports 5 high severity vulnerabilities — review with `npm audit` before shipping past MVP/dev
