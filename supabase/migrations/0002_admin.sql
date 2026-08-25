-- Admin roles: platform admins (onboard clinics) and per-clinic admins
-- (manage their own clinic's staff). Nobody outside the platform team can
-- read platform_admins directly - it has RLS enabled with zero policies, so
-- only the service role or a security definer function can see it.

create table platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

-- providers.email is a denormalized copy of the auth user's email, written
-- once at invite time. It exists purely so the team-management UI can list
-- teammates without needing the service-role-only auth admin API on every
-- render - auth.users itself is never readable through RLS.
alter table providers add column email text not null default '';
alter table providers alter column email drop default;
alter table providers add constraint providers_role_check check (role in ('admin', 'staff'));

create or replace function is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from platform_admins where user_id = auth.uid())
$$;

create or replace function is_clinic_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from providers where user_id = auth.uid() and role = 'admin')
$$;

-- Platform admins can see every clinic (needed for the /admin directory);
-- regular providers keep their existing own-clinic-only policy.
create policy "platform admins can view all clinics" on clinics
  for select using (is_platform_admin());

-- Clinic admins can edit/remove teammates within their own clinic. The
-- `using` clause checks the *caller's* current role via is_clinic_admin(),
-- not the target row, so a non-admin can never grant themselves access by
-- editing their own row - they simply match no policy at all.
create policy "clinic admins can update clinic providers" on providers
  for update using (clinic_id = my_clinic_id() and is_clinic_admin())
  with check (clinic_id = my_clinic_id());

create policy "clinic admins can remove clinic providers" on providers
  for delete using (clinic_id = my_clinic_id() and is_clinic_admin());
