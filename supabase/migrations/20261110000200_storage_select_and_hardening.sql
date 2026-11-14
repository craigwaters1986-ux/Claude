-- =============================================================================
-- Storage read policy + hardening from the Supabase database advisors
-- =============================================================================

-- 1. Storage: let users read objects in their own folder.
--    Public URLs don't need this (they bypass RLS), but the Storage API does:
--    an upsert (the app's x-upsert: true, used so a retry overwrites its own
--    earlier attempt) and remove() both look the object up first, and are
--    refused without a SELECT policy.
create policy "Users can read their own images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'snag-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- The update policy also needs WITH CHECK, so an update can't move a file
-- into someone else's folder.
alter policy "Users can update their own images"
  on storage.objects
  with check (
    bucket_id = 'snag-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 2. Pin search_path on every function (advisor lint 0011). An empty path means
--    every name must be schema-qualified, so nothing can be shadowed.
alter function public.set_updated_at()          set search_path = '';
alter function public.track_snag_resolution()   set search_path = '';
alter function public.protect_project_columns() set search_path = '';
alter function public.protect_snag_columns()    set search_path = '';
alter function public.assign_snag_number()      set search_path = '';

-- 3. assign_snag_number is a trigger function, never meant to be called via
--    /rest/v1/rpc (lints 0028/0029). Triggers don't check EXECUTE when they
--    fire, so revoking it changes nothing for inserts.
revoke execute on function public.assign_snag_number() from public, anon, authenticated;

-- 4. Index the created_by foreign key (lint 0001), used when a user is deleted.
create index snags_created_by_idx on public.snags (created_by);
