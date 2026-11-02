-- Follow-ups to 0009_compliance.sql found by end-to-end testing:
--   1. audit_events are written with the service role, so the database no
--      longer stops a provider action from logging against another clinic's
--      request. The insert trigger now rejects any event whose clinic_id
--      doesn't match its request's clinic - callers pass the acting
--      provider's clinic_id, so a mismatch means a cross-clinic write.
--   2. File names were still kept forever in document_downloaded,
--      document_deleted_by_provider and document_removed_by_patient events
--      (the latter two are written after the delete trigger has already
--      run). The app no longer writes fileName on those events; this
--      scrubs existing ones and widens the delete trigger to any event that
--      references the deleted document.

-- ---------------------------------------------------------------------------
-- 1. Reject cross-clinic audit writes
-- ---------------------------------------------------------------------------

create or replace function audit_events_set_clinic_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_clinic_id uuid;
begin
  if new.request_id is not null then
    select clinic_id into request_clinic_id from requests where id = new.request_id;
    if new.clinic_id is null then
      new.clinic_id := request_clinic_id;
    elsif request_clinic_id is not null and new.clinic_id <> request_clinic_id then
      raise exception 'audit event clinic_id does not match its request''s clinic'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Scrub file names from every event about a deleted document
-- ---------------------------------------------------------------------------

create or replace function scrub_deleted_document_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update audit_events
  set metadata = metadata - 'fileName'
  where metadata ? 'fileName'
    and (
      metadata->>'documentId' = old.id::text
      or (
        event_type = 'document_uploaded'
        and metadata->>'requestDocumentId' = old.request_document_id::text
        and metadata->>'fileName' = old.file_name
      )
    );
  return old;
end;
$$;

-- Deletion events only ever describe documents that are already gone.
update audit_events
set metadata = metadata - 'fileName'
where event_type in ('document_deleted_by_provider', 'document_removed_by_patient')
  and metadata ? 'fileName';

update audit_events a
set metadata = a.metadata - 'fileName'
where a.event_type = 'document_downloaded'
  and a.metadata ? 'fileName'
  and not exists (select 1 from documents d where d.id::text = a.metadata->>'documentId');
