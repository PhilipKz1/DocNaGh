-- Request templates: lets a clinic save a document checklist (e.g. "Pre-op
-- bundle") once and reuse it when creating new requests, instead of
-- retyping the same labels every time. Scoped identically to `requests` -
-- every provider only sees their own clinic's templates.

create table request_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index request_templates_clinic_id_idx on request_templates (clinic_id);

create table request_template_documents (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references request_templates (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create index request_template_documents_template_id_idx on request_template_documents (template_id);

alter table request_templates enable row level security;
alter table request_template_documents enable row level security;

create policy "providers can manage own clinic templates" on request_templates
  for all using (clinic_id = my_clinic_id()) with check (clinic_id = my_clinic_id());

create policy "providers can manage own clinic template documents" on request_template_documents
  for all using (
    exists (
      select 1 from request_templates
      where request_templates.id = request_template_documents.template_id
        and request_templates.clinic_id = my_clinic_id()
    )
  ) with check (
    exists (
      select 1 from request_templates
      where request_templates.id = request_template_documents.template_id
        and request_templates.clinic_id = my_clinic_id()
    )
  );
