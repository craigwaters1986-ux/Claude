# SnagList — Building-site snagging app

Mobile-first web app for logging construction defects (snags / punch-list items) on site,
attaching photos, and generating PDF reports for clients.

**Stack:** Next.js 15 (App Router) · Tailwind CSS v4 · shadcn/ui · Lucide · Supabase (Postgres, Auth, Storage) ·
TanStack Query · `browser-image-compression` · `@react-pdf/renderer`

## Build progress

- [x] **Step 1** — Database schema & project initialisation
- [x] **Step 2** — Supabase client + data-fetching hooks/services
- [ ] Step 3 — Project dashboard & routing
- [ ] Step 4 — Rapid-entry (multi-add) snag form & image upload
- [ ] Step 5 — PDF report generation

## Project initialisation (what was run)

```bash
npx create-next-app@15 snagging --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npm install @supabase/supabase-js @supabase/ssr @tanstack/react-query lucide-react \
            browser-image-compression @react-pdf/renderer sonner \
            clsx tailwind-merge class-variance-authority @radix-ui/react-slot
npm install -D tw-animate-css supabase
npx supabase init
npx shadcn@latest init        # components.json + theme tokens are committed already
```

Add shadcn components as needed, e.g. `npx shadcn@latest add button input textarea card dialog select badge`.

## Setup

1. Create a Supabase project, then copy `.env.example` → `.env.local` and fill in the URL and anon key.
2. Apply the schema — either:
   - `npx supabase link --project-ref <ref>` then `npx supabase db push`, **or**
   - paste `supabase/migrations/20261110000000_initial_schema.sql` into the Supabase SQL editor.
3. `npm run dev`

## Data model

| Table | Key columns |
|---|---|
| `projects` | `id`, `owner_id`, `name`, `description`, `location`, `status` (`active` / `on_hold` / `completed` / `archived`), `created_at` |
| `snags` | `id`, `project_id` → projects, `snag_number` (per-project #1, #2…), `title`, `description`, `location_details`, `status` (`open` / `in_progress` / `resolved`), `image_url`, `image_path`, `resolved_at`, `created_at` |
| `project_summaries` (view) | every project column + `total_snags`, `open_snags`, `in_progress_snags`, `resolved_snags` |

Design notes:

- **Friendly snag numbers.** UUIDs are the real keys, but clients want "Snag #14". A trigger hands out
  numbers from a per-project counter with a row lock, so rapid back-to-back inserts never collide.
- **Row Level Security.** Users only see projects they own; snag access follows the parent project.
  Server-managed columns (`owner_id`, `snag_counter`, `snag_number`, `project_id`) are protected by triggers.
- **Storage.** Bucket `snag-images`, paths `{user_id}/{project_id}/{uuid}.jpg`; upload/delete restricted to
  your own folder. The bucket is public (unguessable UUID paths) so images render directly in the UI and PDF.
  For strictly private photos, set the bucket to private, add a SELECT policy, and use signed URLs.

## Code layout (data layer)

```
src/
  middleware.ts               refreshes the auth session; redirects signed-out users to /login
  lib/supabase/               client.ts (browser) · server.ts (RSC / actions) · middleware.ts · env.ts
  lib/services/               plain async functions over Supabase — no React
    projects.ts snags.ts storage.ts errors.ts
  lib/query-keys.ts           one place that names every cache entry
  hooks/                      TanStack Query hooks used by components
    use-projects.ts use-snags.ts use-supabase.ts
  types/database.ts           DB types (regenerate: npx supabase gen types typescript --linked)
  types/models.ts             app-level types, status labels
  components/providers.tsx    QueryClient + toast notifications
```

Layering: **components → hooks → services → Supabase**. Services can be reused from
server code; hooks add caching, background saving and optimistic updates.

`useCreateSnag` drives Rapid Entry. The snag shows in the list immediately (marked
`_pending`) while it saves in the background, and several saves can run at once. The list
refetches only once the last queued save finishes, so it doesn't flicker mid-burst. Failed
saves retry with backoff; while offline they pause and resume when the signal returns.
