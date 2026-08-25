# Healthcare Document Exchange (MVP)

Provider-initiated healthcare document requests for clinics in Ghana. A provider
creates a request, the patient gets a secure link/QR code, uploads the requested
documents from their phone (no app install), and the provider reviews them in a
dashboard.

Stack: Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres, Auth,
Storage, RLS).

## Setup

1. Create a Supabase project.
2. Run the schema migration against it:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   (Or paste `supabase/migrations/0001_init.sql` into the SQL editor.)
3. Copy `.env.local.example` to `.env.local` and fill in your project's URL,
   anon key, and service role key (Project Settings > API).
4. Create at least one provider account:
   - Add a user via Supabase Auth (dashboard or `supabase.auth.admin.createUser`).
   - Insert a matching row into `clinics` and `providers` (`providers.user_id`
     must equal the auth user's id) so the account can see a clinic's data.
5. Install deps and run the app:
   ```bash
   npm install
   npm run dev
   ```

Use synthetic/test data only - do not upload real patient documents during
development.

## How it fits together

- `supabase/migrations/0001_init.sql` - schema (`clinics`, `providers`,
  `patients`, `requests`, `request_documents`, `documents`, `audit_events`),
  RLS scoping every provider to their own clinic, and the private
  `patient-documents` storage bucket.
- `src/lib/storage/DocumentStorageService.ts` - storage abstraction (signed
  upload/download URLs) implemented today by
  `SupabaseDocumentStorageService`. Swap the implementation behind
  `src/lib/storage/index.ts` to migrate to Azure Blob / S3 / R2 later.
- `src/app/(dashboard, requests/new, requests/[id])` - authenticated provider
  UI: create a request, see its QR code/link, track per-document status,
  download uploaded files.
- `src/app/r/[token]` + `src/app/api/requests/[token]/*` - the patient-facing
  flow. Patients never authenticate; the unguessable `access_token` on
  `requests` is the only credential, validated server-side (service role
  client) with an expiry check on every read/write.
- `src/lib/audit.ts` - every request creation, upload, and download is
  written to `audit_events`.

## Known MVP gaps

- File uploads use a single signed upload URL, not chunked/resumable
  uploads. Fine under the 100 MB cap; revisit with Supabase's resumable
  (TUS) endpoint if that limit grows.
- No retention/deletion job yet - expired requests and their objects are not
  automatically purged.
- `src/lib/supabase/database.types.ts` is hand-written to match the
  migration. Once the project is linked, regenerate it:
  ```bash
  npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
  ```
