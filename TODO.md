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

- [x] **Rotate the Supabase service role key.** Migrated to the new Supabase Secret/Publishable API key system; old legacy `anon`/`service_role` keys deleted from Supabase. `.env.local` and Vercel (Production) env vars updated — `SUPABASE_SERVICE_ROLE_KEY` as Secret, `NEXT_PUBLIC_SUPABASE_ANON_KEY` as Config.
- [ ] **Fix the Auth redirect allow-list.** Supabase Dashboard → Authentication → URL Configuration → Redirect URLs → add `http://localhost:3000/**` for dev and your real domain (`https://yourdomain.com/**`) once you have one. Without this, invite/recovery emails silently drop users on the homepage instead of `/reset-password`.
- [ ] **Set up custom SMTP** (Resend recommended — free tier, good deliverability). Supabase's built-in email sender is testing-only: low rate limits, poor deliverability, no branding. Configure in Supabase Dashboard → Project Settings → Authentication → SMTP Settings once you have a Resend account + verified sending domain.
- [x] **Buy a domain** — `medswyft.com` registered via Cloudflare, DNS already pointed at Vercel.
- [ ] Set `RESEND_API_KEY` (and optionally a verified-domain `EMAIL_FROM`) so the provider/patient upload-notification emails (`src/lib/email.ts`) actually send instead of just logging to the console.
- [x] Set `CRON_SECRET` and `DOCUMENT_RETENTION_DAYS` in production env vars (Vercel project settings). `vercel.json` schedules the retention purge daily at 03:00 UTC once deployed there.
- [x] Set `NEXT_PUBLIC_APP_URL` to the real `https://` production domain (`https://medswyft.com`).
- [ ] **Fix Vercel env var types.** Several non-secret settings (`DOCUMENT_RETENTION_DAYS`, `SIGNED_URL_TTL_SECONDS`, `SUPABASE_DOCUMENTS_BUCKET`, and especially `NEXT_PUBLIC_SUPABASE_URL`, which is public by design) got marked "Secret" instead of "Config" in Vercel, which made `vercel env pull` unable to retrieve them. Delete and re-add as Config so local env setup doesn't require guessing/reconstructing these values again.
- [x] Delete the leftover ad-hoc `provider@dropmy.test` test data

## Known gaps (called out in README, not yet built)

- [ ] Resumable/chunked uploads — currently a single signed upload URL per file, fine under the 10MB cap but not truly resumable; revisit with Supabase's TUS endpoint if needed
- [ ] Patient "missing documents" nudge / reminder flow (spec mentions tracking "which are missing" — status exists in schema but nothing acts on it yet). Highest-priority gap left: nothing currently re-engages a patient who never uploads.
- [x] Request templates — a clinic can save a request's document checklist and reuse it (`request_templates`/`request_template_documents`, `src/app/actions/templates.ts`, template picker on `/requests/new`).

## Security hardening not yet done

- [x] File content now verified against magic-number signatures (`src/lib/storage/fileSignature.ts`), not just the client-reported mimeType — a mislabeled/renamed file is rejected and deleted at confirm-upload time.
- [x] ~~Next.js 2 major versions behind with 5 high-severity CVEs~~ — stale; the app is already on Next 15.5.25. Current `npm audit` (checked 2026-09-12) shows only 3 findings: 1 high in `js-yaml` (dev-only, pulled in by ESLint, never runs in production) and 1 high + 1 moderate in `postcss`'s CSS source-map handling, which only matters if an attacker controls CSS input to the build — not applicable here. Routine dependency hygiene, not an urgent fix.
- [ ] No rate limiting on the patient-facing token endpoints (`/r/[token]`, `/api/requests/[token]/*`). The token itself is 256 bits of entropy (effectively unguessable), so this is defense-in-depth rather than the primary control, but there's currently no protection against scripted abuse of a single known/leaked token either. Left out because in-memory rate limiting doesn't work reliably on serverless (stateless, multi-instance) — would need Upstash/Redis or similar if this becomes a real deployment target.
- [ ] `audit_events.metadata` stores the original `file_name` for `document_uploaded` indefinitely, even after the document itself is deleted/purged (retention only removes the `documents` row + storage object, not the audit trail). Fine for now since it's provider-only readable and filenames are rarely identifying on their own, but worth revisiting if audit retention needs its own policy later.

## Nice-to-haves from the spec

- [x] Patient-facing confirmation (email receipt) after successful upload — `notifyUploadReceived()` in the confirm-upload route; needs `RESEND_API_KEY` set to actually send (see above)
- [x] Provider notification when a patient uploads a document — same mechanism
- [ ] DICOM / large medical imaging support (explicitly deferred in the original spec)

## Housekeeping

- [ ] Decide on Node version — dev machine is on Node 18.18.2; `@supabase/supabase-js` warns it wants Node 22+, and `create-next-app@latest` needs Node 20.9+. Works fine today but will need an upgrade eventually.
- [x] Unit tests added (`npm test`, Vitest) covering the security/correctness-critical pure logic: file-signature/magic-number validation, file type/size validation, HTML-escaping in emails, request status recomputation, and app-URL production safety checks. Doesn't cover server actions/DB-touching code (would need a Supabase mocking layer) or UI rendering.
