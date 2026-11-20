-- =============================================================================
-- Multiple photos per snag
--
-- snag_photos holds every photo of a snag, in order. snags.image_url /
-- image_path stay as the snag's "cover" (its first photo), kept in sync by a
-- trigger, so lists and anything reading the old columns keep working.
-- =============================================================================

create table public.snag_photos (
  id          uuid primary key default gen_random_uuid(),
  snag_id     uuid not null references public.snags (id) on delete cascade,
  position    integer not null default 0,
  image_url   text not null,
  image_path  text not null,
  created_at  timestamptz not null default now()
);

create index snag_photos_snag_position_idx on public.snag_photos (snag_id, position, created_at);

-- Existing single photos become each snag's first photo.
insert into public.snag_photos (snag_id, position, image_url, image_path, created_at)
select id, 0, image_url, image_path, created_at
from public.snags
where image_url is not null and image_path is not null;

-- -----------------------------------------------------------------------------
-- Keep snags.image_url / image_path pointing at the first photo.
-- -----------------------------------------------------------------------------
create or replace function public.sync_snag_cover()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target uuid := coalesce(new.snag_id, old.snag_id);
begin
  -- Always exactly one row: the first photo, or nulls when none are left.
  update public.snags s
     set image_url  = first.image_url,
         image_path = first.image_path
    from (
      select
        (select ph.image_url  from public.snag_photos ph where ph.snag_id = target order by ph.position, ph.created_at limit 1) as image_url,
        (select ph.image_path from public.snag_photos ph where ph.snag_id = target order by ph.position, ph.created_at limit 1) as image_path
    ) first
   where s.id = target
     and (s.image_url is distinct from first.image_url or s.image_path is distinct from first.image_path);
  return null;
end;
$$;

create trigger snag_photos_sync_cover
  after insert or update or delete on public.snag_photos
  for each row execute function public.sync_snag_cover();

-- -----------------------------------------------------------------------------
-- A sanity cap well above the app's own limit, so a bug can't attach hundreds.
-- -----------------------------------------------------------------------------
create or replace function public.limit_snag_photos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.snag_photos where snag_id = new.snag_id) >= 12 then
    raise exception 'A snag can have at most 12 photos';
  end if;
  return new;
end;
$$;

create trigger snag_photos_limit
  before insert on public.snag_photos
  for each row execute function public.limit_snag_photos();

-- -----------------------------------------------------------------------------
-- Row Level Security: a photo belongs to whoever owns the snag's project.
-- -----------------------------------------------------------------------------
alter table public.snag_photos enable row level security;

create policy "Project owners can view snag photos"
  on public.snag_photos for select to authenticated
  using (exists (select 1 from public.snags s join public.projects p on p.id = s.project_id
                 where s.id = snag_photos.snag_id and p.owner_id = (select auth.uid())));

create policy "Project owners can add snag photos"
  on public.snag_photos for insert to authenticated
  with check (exists (select 1 from public.snags s join public.projects p on p.id = s.project_id
                      where s.id = snag_photos.snag_id and p.owner_id = (select auth.uid())));

create policy "Project owners can update snag photos"
  on public.snag_photos for update to authenticated
  using (exists (select 1 from public.snags s join public.projects p on p.id = s.project_id
                 where s.id = snag_photos.snag_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.snags s join public.projects p on p.id = s.project_id
                      where s.id = snag_photos.snag_id and p.owner_id = (select auth.uid())));

create policy "Project owners can delete snag photos"
  on public.snag_photos for delete to authenticated
  using (exists (select 1 from public.snags s join public.projects p on p.id = s.project_id
                 where s.id = snag_photos.snag_id and p.owner_id = (select auth.uid())));

-- A photo can't be moved to another snag.
create or replace function public.protect_snag_photo_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.snag_id := old.snag_id;
  return new;
end;
$$;

create trigger snag_photos_protect_columns
  before update on public.snag_photos
  for each row execute function public.protect_snag_photo_columns();
