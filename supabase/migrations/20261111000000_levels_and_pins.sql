-- =============================================================================
-- Stage 1: drawings with levels
--
-- A project has levels (Ground, First, Roof ...). Each level can have one
-- drawing, stored as an image (PDFs are converted to an image in the browser).
-- A snag can be pinned to a spot on its level's drawing.
-- =============================================================================

create table public.levels (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects (id) on delete cascade,
  name            text not null check (char_length(trim(name)) between 1 and 100),
  position        integer not null default 0,
  drawing_url     text,
  drawing_path    text,
  -- Pixel size of the drawing image, so plans keep their shape before loading.
  drawing_width   integer,
  drawing_height  integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index levels_project_position_idx on public.levels (project_id, position, created_at);

create trigger levels_set_updated_at
  before update on public.levels
  for each row execute function public.set_updated_at();

-- A level can't be moved to another project.
create or replace function public.protect_level_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.project_id := old.project_id;
  return new;
end;
$$;

create trigger levels_protect_columns
  before update on public.levels
  for each row execute function public.protect_level_columns();

alter table public.levels enable row level security;

create policy "Project owners can view levels"
  on public.levels for select to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = levels.project_id and p.owner_id = (select auth.uid())));

create policy "Project owners can create levels"
  on public.levels for insert to authenticated
  with check (exists (select 1 from public.projects p
                      where p.id = levels.project_id and p.owner_id = (select auth.uid())));

create policy "Project owners can update levels"
  on public.levels for update to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = levels.project_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p
                      where p.id = levels.project_id and p.owner_id = (select auth.uid())));

create policy "Project owners can delete levels"
  on public.levels for delete to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = levels.project_id and p.owner_id = (select auth.uid())));

-- -----------------------------------------------------------------------------
-- Snags: which level, and where on its drawing.
-- pin_x / pin_y are fractions of the drawing's width / height (0 = left/top,
-- 1 = right/bottom), so a pin stays put whatever size the plan is shown at.
-- Deleting a level keeps its snags but clears their level and pin.
-- -----------------------------------------------------------------------------
alter table public.snags
  add column level_id uuid references public.levels (id) on delete set null,
  add column pin_x real check (pin_x is null or (pin_x >= 0 and pin_x <= 1)),
  add column pin_y real check (pin_y is null or (pin_y >= 0 and pin_y <= 1)),
  add constraint snags_pin_complete check ((pin_x is null) = (pin_y is null));

create index snags_level_idx on public.snags (level_id);

-- A snag's level must belong to the snag's own project, and a pin needs a level.
create or replace function public.check_snag_level()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.level_id is null then
    new.pin_x := null;
    new.pin_y := null;
  elsif not exists (select 1 from public.levels l where l.id = new.level_id and l.project_id = new.project_id) then
    raise exception 'Level does not belong to this project';
  end if;
  return new;
end;
$$;

create trigger snags_check_level
  before insert or update of level_id, pin_x, pin_y on public.snags
  for each row execute function public.check_snag_level();
