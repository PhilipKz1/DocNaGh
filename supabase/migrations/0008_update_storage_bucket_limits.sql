-- Align the storage bucket's own hard limits with the app-level validation
-- in src/lib/storage/fileValidation.ts:
--   - allowed_mime_types didn't include HEIC/HEIF, so a patient's iPhone
--     photo would be rejected by Supabase Storage itself even after the app
--     started accepting it.
--   - file_size_limit tightened from 100 MB to 10 MB to match the new
--     per-file cap, so a bug in app-level validation can't be bypassed to
--     upload an oversized file directly against the storage API.

update storage.buckets
set
  file_size_limit = 10485760, -- 10 MB
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']
where id = 'patient-documents';
