-- =============================================================================
-- Pick up where you left off, across devices
--
-- 1. user_state: one row per user remembering the project and view they were
--    last on (from any device), so another device can offer "Continue".
-- 2. project_summaries gains last_activity_at, so the most recently worked-on
--    project sorts first.
-- 3. Live updates: snags, photos, levels and projects are published to
--    Supabase Realtime, so an open laptop updates while snags are logged on a
--    phone. Realtime applies each viewer's RLS, so nobody receives rows they
--    can't already read.
-- =============================================================================

create table public.user_state (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete set null,
  view        text check (view in ('list', 'plans')),
  level_id    uuid references public.levels (id) on delete set null,
  device      text check (device in ('phone', 'tablet', 'desktop')),
  updated_at  timestamptz not null default now()
);

create index user_state_project_idx on public.user_state (project_id);
create index user_state_level_idx on public.user_state (level_id);

create trigger user_state_set_updated_at
  before update on public.user_state
  for each row execute function public.set_updated_at();

alter table public.user_state enable row level security;

create policy "Users can view their own state"
  on public.user_state for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own state"
  on public.user_state for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (project_id is null or exists (select 1 from public.projects p
                                       where p.id = project_id and p.owner_id = (select auth.uid())))
  );

create policy "Users can update their own state"
  on public.user_state for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (project_id is null or exists (select 1 from public.projects p
                                       where p.id = project_id and p.owner_id = (select auth.uid())))
  );

-- -----------------------------------------------------------------------------
-- Most recent activity per project: the project itself, or any of its snags,
-- photos or levels. (Columns can only be appended to a view in place.)
-- -----------------------------------------------------------------------------
create or replace view public.project_summaries
with (security_invoker = true)
as
select
  p.*,
  count(s.id)                                         as total_snags,
  count(s.id) filter (where s.status = 'open')        as open_snags,
  count(s.id) filter (where s.status = 'in_progress') as in_progress_snags,
  count(s.id) filter (where s.status = 'resolved')    as resolved_snags,
  greatest(
    p.updated_at,
    max(s.updated_at),
    (select max(ph.created_at) from public.snag_photos ph join public.snags s2 on s2.id = ph.snag_id where s2.project_id = p.id),
    (select max(l.updated_at) from public.levels l where l.project_id = p.id)
  )                                                   as last_activity_at
from public.projects p
left join public.snags s on s.project_id = p.id
group by p.id;

create index snags_project_updated_idx on public.snags (project_id, updated_at desc);

-- -----------------------------------------------------------------------------
-- Live updates (Supabase Realtime). Skipped where the publication doesn't
-- exist (plain Postgres, e.g. local tests).
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.projects, public.snags, public.snag_photos, public.levels;
  end if;
end;
$$;
