-- =============================================================================
-- Snags: add "assigned to"
--
-- The snag form is now three lines: title, assigned to, comments.
--   title       → snags.title        (unchanged)
--   assigned to → snags.assigned_to  (new: a trade or person, free text)
--   comments    → snags.description  (unchanged column, relabelled in the UI)
--
-- location_details stays in the table (nullable) so existing rows keep their
-- data, but the form no longer asks for it.
-- =============================================================================

alter table public.snags
  add column assigned_to text check (assigned_to is null or char_length(assigned_to) <= 200);

comment on column public.snags.assigned_to is 'Trade or person responsible for fixing the snag (free text).';
comment on column public.snags.description is 'Comments about the snag (shown as "Comments" in the app and report).';

-- Lets a report or filter group a project's snags by who they're assigned to.
create index snags_project_assigned_idx on public.snags (project_id, assigned_to);
