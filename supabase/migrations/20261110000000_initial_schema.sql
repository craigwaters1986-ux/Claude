-- =============================================================================
-- Snagging App — Initial schema
-- Tables: projects, snags
-- Storage: snag-images bucket
-- Security: Row Level Security, owner-scoped (each contractor sees only their data)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum types
--    Enums give us DB-level validation (no "resloved" typos) and map cleanly
--    to TypeScript union types via `supabase gen types`.
-- -----------------------------------------------------------------------------
create type public.project_status as enum ('active', 'on_hold', 'completed', 'archived');
create type public.snag_status    as enum ('open', 'in_progress', 'resolved');

-- -----------------------------------------------------------------------------
-- 2. Shared trigger: keep updated_at current
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. projects
-- -----------------------------------------------------------------------------
create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid()
                 references auth.users (id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 1 and 200),
  description  text,
  location     text,
  status       public.project_status not null default 'active',
  -- Per-project counter used to give snags human-friendly numbers (#1, #2 …).
  -- Maintained by trigger; never set from the client.
  snag_counter integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index projects_owner_created_idx on public.projects (owner_id, created_at desc);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. snags
-- -----------------------------------------------------------------------------
create table public.snags (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  -- Human-readable sequential number within the project (shown as "#12" in UI/PDF).
  snag_number      integer not null,
  title            text not null check (char_length(trim(title)) between 1 and 200),
  description      text,
  location_details text,                      -- e.g. "Master Bedroom"
  status           public.snag_status not null default 'open',
  image_url        text,                      -- public URL rendered in UI / PDF
  image_path       text,                      -- storage object path, needed to delete the file
  created_by       uuid default auth.uid() references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  resolved_at      timestamptz,
  unique (project_id, snag_number)
);

create index snags_project_created_idx on public.snags (project_id, created_at desc);
create index snags_project_status_idx  on public.snags (project_id, status);

create trigger snags_set_updated_at
  before update on public.snags
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Assign snag_number atomically.
--    UPDATE ... RETURNING takes a row lock on the parent project, so two
--    rapid-fire inserts (the Multi-Add workflow) can never get the same number.
--    SECURITY DEFINER so it can bump the counter regardless of column grants;
--    RLS on snags still decides whether the insert is allowed at all.
-- -----------------------------------------------------------------------------
create or replace function public.assign_snag_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects
     set snag_counter = snag_counter + 1
   where id = new.project_id
  returning snag_counter into new.snag_number;

  if new.snag_number is null then
    raise exception 'Project % not found', new.project_id;
  end if;

  return new;
end;
$$;

create trigger snags_assign_number
  before insert on public.snags
  for each row execute function public.assign_snag_number();

-- Keep resolved_at in sync with status (useful for reports / "time to fix").
create or replace function public.track_snag_resolution()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'resolved' and (tg_op = 'INSERT' or old.status is distinct from 'resolved') then
    new.resolved_at := now();
  elsif new.status <> 'resolved' then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

create trigger snags_track_resolution
  before insert or update of status on public.snags
  for each row execute function public.track_snag_resolution();

-- -----------------------------------------------------------------------------
-- 6. Summary view for the dashboard & PDF header (open / in-progress / resolved counts)
--    security_invoker = true → the view respects the caller's RLS policies.
-- -----------------------------------------------------------------------------
create view public.project_summaries
with (security_invoker = true)
as
select
  p.*,
  count(s.id)                                         as total_snags,
  count(s.id) filter (where s.status = 'open')        as open_snags,
  count(s.id) filter (where s.status = 'in_progress') as in_progress_snags,
  count(s.id) filter (where s.status = 'resolved')    as resolved_snags
from public.projects p
left join public.snags s on s.project_id = p.id
group by p.id;

-- -----------------------------------------------------------------------------
-- 7. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.snags    enable row level security;

-- projects: owner has full CRUD
create policy "Owners can view their projects"
  on public.projects for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners can create projects"
  on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners can update their projects"
  on public.projects for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners can delete their projects"
  on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()));

-- snags: access flows from ownership of the parent project
create policy "Project owners can view snags"
  on public.snags for select to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = snags.project_id and p.owner_id = (select auth.uid())));

create policy "Project owners can create snags"
  on public.snags for insert to authenticated
  with check (exists (select 1 from public.projects p
                      where p.id = snags.project_id and p.owner_id = (select auth.uid())));

create policy "Project owners can update snags"
  on public.snags for update to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = snags.project_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p
                      where p.id = snags.project_id and p.owner_id = (select auth.uid())));

create policy "Project owners can delete snags"
  on public.snags for delete to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = snags.project_id and p.owner_id = (select auth.uid())));

-- Clients must not tamper with server-managed columns.
-- (A column-level REVOKE would be a no-op here because Supabase grants
--  table-level UPDATE to `authenticated`, so we enforce it with triggers.
--  Inside the SECURITY DEFINER numbering function current_user is the
--  function owner, so that legitimate counter bump is still allowed.)
create or replace function public.protect_project_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.owner_id     := old.owner_id;
    new.snag_counter := old.snag_counter;
  end if;
  return new;
end;
$$;

create trigger projects_protect_columns
  before update on public.projects
  for each row execute function public.protect_project_columns();

create or replace function public.protect_snag_columns()
returns trigger
language plpgsql
as $$
begin
  new.project_id  := old.project_id;
  new.snag_number := old.snag_number;
  new.created_by  := old.created_by;
  return new;
end;
$$;

create trigger snags_protect_columns
  before update on public.snags
  for each row execute function public.protect_snag_columns();

-- -----------------------------------------------------------------------------
-- 8. Storage: snag-images bucket
--    Object path convention: {user_id}/{project_id}/{uuid}.jpg
--    The first folder segment is the uploader's user id, which the policies check.
--
--    The bucket is PUBLIC so image_url works directly in <img> tags and in the
--    PDF renderer without signing. Paths contain random UUIDs (unguessable).
--    If photos must be strictly private, set public = false and switch the app
--    to createSignedUrl() — see README.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'snag-images',
  'snag-images',
  true,
  10485760,  -- 10 MB hard cap (client compresses to ~1 MB anyway)
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy "Users can upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'snag-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'snag-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'snag-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- (No SELECT policy needed for public-bucket reads via the public URL.
--  Add one if you switch the bucket to private.)
