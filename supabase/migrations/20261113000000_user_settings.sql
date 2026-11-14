-- =============================================================================
-- Per-user settings (appearance, report branding, defaults), shared across the
-- user's devices. Stored as JSON so new options don't need a migration; the
-- app validates and fills in defaults.
-- =============================================================================

create table public.user_settings (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  settings    jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 16384),
  updated_at  timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
  on public.user_settings for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own settings"
  on public.user_settings for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own settings"
  on public.user_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Settings changed on one device apply live on the others.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.user_settings;
  end if;
end;
$$;
