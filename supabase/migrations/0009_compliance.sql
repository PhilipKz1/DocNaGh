-- Compliance hardening (Ghana Data Protection Act, 2012):
--   1. Server-side record of patient consent per request.
--   2. audit_events scoped by clinic_id. Previously the select policy let
--      every provider read every event with a null request_id - including
--      other clinics' teammate_invited (email) and clinic_created events.
--   3. audit_events become server-write-only, so a provider can't insert
--      forged entries into their clinic's audit trail.
--   4. Original file names are scrubbed from audit metadata once the
--      document itself is deleted, so retention/erasure actually removes them.

-- ---------------------------------------------------------------------------
-- 1. Consent
-- ---------------------------------------------------------------------------

alter table requests add column consented_at timestamptz;
alter table requests add column consent_version text;

-- ---------------------------------------------------------------------------
-- 2. audit_events.clinic_id
-- ---------------------------------------------------------------------------

alter table audit_events
  add column clinic_id uuid references clinics (id) on delete set null;

create index audit_events_clinic_id_idx on audit_events (clinic_id);

update audit_events a
set clinic_id = r.clinic_id
from requests r
where a.request_id = r.id and a.clinic_id is null;

-- Clinic-level events (teammate_invited/removed) have no request but were
-- written with the acting provider's id.
update audit_events a
set clinic_id = p.clinic_id
from providers p
where a.request_id is null
  and a.clinic_id is null
  and a.actor_type = 'provider'
  and a.actor_id = p.id;

-- Fill clinic_id from the request when the caller only supplied request_id.
create or replace function audit_events_set_clinic_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.clinic_id is null and new.request_id is not null then
    select clinic_id into new.clinic_id from requests where id = new.request_id;
  end if;
  return new;
end;
$$;

create trigger audit_events_set_clinic_id
  before insert on audit_events
  for each row execute function audit_events_set_clinic_id();

drop policy "providers can view own clinic audit_events" on audit_events;
drop policy "providers can insert own clinic audit_events" on audit_events;

-- Platform-level events (clinic_created/deleted) have a null clinic_id and
-- are now visible to no provider at all - only the service role.
create policy "providers can view own clinic audit_events" on audit_events
  for select using (clinic_id = my_clinic_id());

-- ---------------------------------------------------------------------------
-- 4. Scrub file names from audit metadata when a document is deleted
-- ---------------------------------------------------------------------------

-- Matches on documentId for new events; older events only recorded
-- requestDocumentId + fileName, so fall back to that pair.
create or replace function scrub_deleted_document_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update audit_events
  set metadata = metadata - 'fileName'
  where event_type = 'document_uploaded'
    and metadata ? 'fileName'
    and (
      metadata->>'documentId' = old.id::text
      or (
        metadata->>'requestDocumentId' = old.request_document_id::text
        and metadata->>'fileName' = old.file_name
      )
    );
  return old;
end;
$$;

create trigger documents_scrub_audit
  after delete on documents
  for each row execute function scrub_deleted_document_audit();

-- Backfill: scrub names for documents that are already gone.
update audit_events a
set metadata = a.metadata - 'fileName'
where a.event_type = 'document_uploaded'
  and a.metadata ? 'fileName'
  and not exists (
    select 1 from documents d
    where d.request_document_id::text = a.metadata->>'requestDocumentId'
      and d.file_name = a.metadata->>'fileName'
  );
