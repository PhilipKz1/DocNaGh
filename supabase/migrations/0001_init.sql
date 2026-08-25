-- Healthcare Document Exchange Platform - initial schema
-- Providers authenticate via Supabase Auth. Patients never authenticate;
-- they reach a request only through its unguessable access_token, and all
-- patient-side reads/writes go through a server route using the service
-- role key (RLS below only governs the authenticated provider dashboard).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table providers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

create index providers_clinic_id_idx on providers (clinic_id);

-- Patients are scoped to the clinic that registered them for MVP. Sharing a
-- patient record across clinics is a later feature, not needed for
-- request -> upload -> receive.
create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create index patients_clinic_id_idx on patients (clinic_id);

create table requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics (id) on delete cascade,
  provider_id uuid not null references providers (id) on delete restrict,
  patient_id uuid references patients (id) on delete set null,
  patient_display_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'partially_received', 'complete', 'expired', 'cancelled')),
  access_token text not null unique default encode(gen_random_bytes(32), 'base64url'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index requests_clinic_id_idx on requests (clinic_id);
create index requests_access_token_idx on requests (access_token);

create table request_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  label text not null,
  notes text,
  status text not null default 'requested'
    check (status in ('requested', 'uploaded', 'missing')),
  created_at timestamptz not null default now()
);

create index request_documents_request_id_idx on request_documents (request_id);

create table documents (
  id uuid primary key default gen_random_uuid(),
  request_document_id uuid not null references request_documents (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 104857600), -- 100 MB
  uploaded_at timestamptz not null default now()
);

create index documents_request_document_id_idx on documents (request_document_id);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests (id) on delete set null,
  actor_type text not null check (actor_type in ('provider', 'patient', 'system')),
  actor_id uuid,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_request_id_idx on audit_events (request_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Returns the calling user's clinic_id, or null if they aren't a provider.
-- security definer + fixed search_path so it can be used inside RLS policies
-- without each policy re-deriving it via a join.
create or replace function my_clinic_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select clinic_id from providers where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security: authenticated providers, scoped to their own clinic
-- ---------------------------------------------------------------------------

alter table clinics enable row level security;
alter table providers enable row level security;
alter table patients enable row level security;
alter table requests enable row level security;
alter table request_documents enable row level security;
alter table documents enable row level security;
alter table audit_events enable row level security;

create policy "providers can view own clinic" on clinics
  for select using (id = my_clinic_id());

create policy "providers can view clinic teammates" on providers
  for select using (clinic_id = my_clinic_id());

create policy "providers can manage own clinic patients" on patients
  for all using (clinic_id = my_clinic_id())
  with check (clinic_id = my_clinic_id());

create policy "providers can manage own clinic requests" on requests
  for all using (clinic_id = my_clinic_id())
  with check (clinic_id = my_clinic_id());

create policy "providers can manage own clinic request_documents" on request_documents
  for all using (
    exists (
      select 1 from requests
      where requests.id = request_documents.request_id
        and requests.clinic_id = my_clinic_id()
    )
  )
  with check (
    exists (
      select 1 from requests
      where requests.id = request_documents.request_id
        and requests.clinic_id = my_clinic_id()
    )
  );

create policy "providers can view own clinic documents" on documents
  for select using (
    exists (
      select 1 from request_documents
      join requests on requests.id = request_documents.request_id
      where request_documents.id = documents.request_document_id
        and requests.clinic_id = my_clinic_id()
    )
  );

create policy "providers can view own clinic audit_events" on audit_events
  for select using (
    request_id is null or exists (
      select 1 from requests
      where requests.id = audit_events.request_id
        and requests.clinic_id = my_clinic_id()
    )
  );

create policy "providers can insert own clinic audit_events" on audit_events
  for insert with check (
    request_id is null or exists (
      select 1 from requests
      where requests.id = audit_events.request_id
        and requests.clinic_id = my_clinic_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: private bucket for uploaded documents
-- Objects are keyed as `${clinic_id}/${request_id}/${uuid}-${filename}`.
-- Patients upload via signed upload URLs minted by a server route with the
-- service role key, so no patient-facing storage policy is needed. Providers
-- read via signed download URLs minted the same way, scoped by the
-- documents.storage_path RLS above rather than storage.objects policies.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-documents',
  'patient-documents',
  false,
  104857600, -- 100 MB
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;
