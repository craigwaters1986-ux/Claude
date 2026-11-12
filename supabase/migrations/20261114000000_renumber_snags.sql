-- =============================================================================
-- Snag numbers close up after a delete.
--
-- Before: numbers were never reused (delete #2 of 5 and the list read 1, 3, 4, 5;
-- the next snag was #6). Now the remaining snags are renumbered 1..n in their
-- existing order and the next new snag gets n + 1.
--
-- Note: a printed report made before a delete may then show different numbers
-- from the app for the snags after the deleted one.
-- =============================================================================

-- Snag numbers may only be changed by the database itself (the renumbering
-- function below runs as its owner); app users still can't set them.
create or replace function public.protect_snag_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.project_id := old.project_id;
  new.created_by := old.created_by;
  if current_user in ('authenticated', 'anon') then
    new.snag_number := old.snag_number;
  end if;
  return new;
end;
$$;

-- Renumber one project's snags 1..n (keeping their order) and reset its counter.
create or replace function public.renumber_project_snags(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Lock the project first: new snags take the same lock to get a number,
  -- so a snag added at the same moment waits and then gets n + 1.
  perform 1 from public.projects where id = target for update;
  if not found then
    return; -- the project itself is being deleted
  end if;

  -- Two steps so no two snags ever share a number mid-way (unique per project).
  update public.snags
     set snag_number = -snag_number
   where project_id = target and snag_number > 0;

  update public.snags s
     set snag_number = r.n
    from (
      select id, row_number() over (order by -snag_number, created_at, id) as n
        from public.snags
       where project_id = target
    ) r
   where s.id = r.id;

  update public.projects
     set snag_counter = (select count(*) from public.snags where project_id = target)
   where id = target;
end;
$$;

revoke execute on function public.renumber_project_snags(uuid) from public, anon, authenticated;

-- After a delete (once per statement, however many snags it removed).
create or replace function public.renumber_snags_after_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  for target in select distinct project_id from deleted_snags order by project_id loop
    perform public.renumber_project_snags(target);
  end loop;
  return null;
end;
$$;

revoke execute on function public.renumber_snags_after_delete() from public, anon, authenticated;

create trigger snags_renumber_after_delete
  after delete on public.snags
  referencing old table as deleted_snags
  for each statement execute function public.renumber_snags_after_delete();

-- Close the gaps left by earlier deletes.
do $$
declare
  target uuid;
begin
  for target in select id from public.projects order by id loop
    perform public.renumber_project_snags(target);
  end loop;
end;
$$;
