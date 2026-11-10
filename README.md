# SnagList — Building-site snagging app

Mobile-first web app for logging construction defects (snags / punch-list items) on site,
attaching photos, and generating PDF reports for clients.

**Stack:** Next.js 15 (App Router) · Tailwind CSS v4 · shadcn/ui · Lucide · Supabase (Postgres, Auth, Storage) ·
TanStack Query · `@react-pdf/renderer`

## Build progress

- [x] **Step 1** — Database schema & project initialisation
- [x] **Step 2** — Supabase client + data-fetching hooks/services
- [x] **Step 3** — Project dashboard & routing
- [x] **Step 4** — Rapid-entry (multi-add) snag form & image upload
- [x] **Step 5** — PDF report generation

## Project initialisation (what was run)

```bash
npx create-next-app@15 snagging --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npm install @supabase/supabase-js @supabase/ssr @tanstack/react-query lucide-react \
            @react-pdf/renderer sonner \
            clsx tailwind-merge class-variance-authority @radix-ui/react-slot
npm install -D tw-animate-css supabase
npx supabase init
npx shadcn@latest init        # components.json + theme tokens are committed already
```

Add shadcn components as needed, e.g. `npx shadcn@latest add button input textarea card dialog select badge`.

## Setup

1. Create a Supabase project, then copy `.env.example` → `.env.local` and fill in the project URL and
   publishable key (`sb_publishable_…`, Dashboard → Project Settings → API Keys). The legacy anon key
   also works, as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Apply the schema — either:
   - `npx supabase link --project-ref <ref>` then `npx supabase db push`, **or**
   - paste each file in `supabase/migrations/` into the Supabase SQL editor, oldest first.
3. **Auth settings** (Supabase Dashboard → Authentication):
   - *URL Configuration*: set **Site URL** to your app URL and add `http://localhost:3000/auth/callback`
     (plus your production `/auth/callback`) to **Redirect URLs**.
   - *Email Templates → Magic Link*: add the code so people can type it in:
     `<p>Or enter this code: <strong>{{ .Token }}</strong></p>`
     On phones the email often opens in a different browser from the one that asked for the link,
     and then the link can't complete sign-in. The 6-digit code always works.
4. `npm run dev`

## Data model

| Table | Key columns |
|---|---|
| `projects` | `id`, `owner_id`, `name`, `description`, `location`, `status` (`active` / `on_hold` / `completed` / `archived`), `created_at` |
| `snags` | `id`, `project_id` → projects, `snag_number` (per-project #1, #2…), `title`, `assigned_to`, `description` (shown as "Comments"), `status` (`open` / `in_progress` / `resolved`), `image_url` / `image_path` (the cover: first photo, kept in sync by trigger), `resolved_at`, `created_at`. `location_details` remains for older rows but the form no longer asks for it. |
| `snag_photos` | `id`, `snag_id` → snags (cascade), `position`, `image_url`, `image_path`, `created_at`. Up to 6 per snag in the app (12 enforced by the database). |
| `project_summaries` (view) | every project column + `total_snags`, `open_snags`, `in_progress_snags`, `resolved_snags` |

Design notes:

- **Three-line snags.** Each snag is up to six photos plus title, assigned to (a trade or person, free
  text) and comments. New snags start as Open; status is changed from the project list.
- **Friendly snag numbers.** UUIDs are the real keys, but clients want "Snag #14". A trigger hands out
  numbers from a per-project counter with a row lock, so rapid back-to-back inserts never collide.
  Numbers of deleted snags are never reused, so a reference in an old report stays unambiguous.
- **Row Level Security.** Users only see projects they own; snag access follows the parent project.
  Server-managed columns (`owner_id`, `snag_counter`, `snag_number`, `project_id`) are protected by triggers.
- **Storage.** Bucket `snag-images`, paths `{user_id}/{project_id}/{uuid}.jpg`; upload/delete restricted to
  your own folder. The bucket is public (unguessable UUID paths) so images render directly in the UI and PDF.
  A SELECT policy on your own folder is still required: Storage looks a file up before overwriting
  (upsert, used by retries) or deleting it.
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

## Routes

| Route | What it is |
|---|---|
| `/login` | Email sign-in: magic link, or 6-digit code fallback |
| `/auth/callback` | Magic-link landing; exchanges the code for a session cookie |
| `/` | Project dashboard: search, create, edit, delete, show/hide archived |
| `/projects/[projectId]` | Project header + counts, status filter tabs, snag list (change status, delete). Tap a snag to view/add/delete its photos and edit its details |
| `/projects/[projectId]/add` | **Rapid Entry**: up to 6 photos + three lines (title, assigned to, comments) → "Save & add next", repeat |

Signed-out visitors are sent to `/login?next=…` and returned to the page they wanted after signing in.
UI components in `src/components/ui/` are standard shadcn/ui sources.

## Rapid Entry & photo uploads

Each "Save & add next" starts one background job (`useCreateSnag` in `src/hooks/use-snags.ts`)
and clears the form at once:

1. **Compress** (`src/lib/image/compress.ts`): canvas resize to 1920 px longest edge, JPEG at 0.8,
   EXIF rotation applied, transparent PNGs flattened onto white. Typically 2–5 MB becomes 300 KB.
   No third-party library, so nothing is fetched from a CDN on a weak connection.
2. **Upload** (`src/lib/services/storage.ts`) each photo in turn to
   `snag-images/{userId}/{projectId}/{snagId}/{photoId}.jpg` via XMLHttpRequest, because `fetch` can't
   report upload progress ("Uploading photo 2 of 3 · 45%").
3. **Save** the snag row (the database assigns its number), then its photo rows.

Behaviour on site:
- Captures run one at a time, in the order logged, so snag numbers follow the walk-round.
- The snag appears in the project list straight away with its local photo, marked "Saving…".
- Leaving the page doesn't stop uploads. Closing the tab mid-upload asks for confirmation.
- Network errors retry 3 times with backoff; offline captures wait and resume when signal returns.
  Anything that still fails stays in "Logged this visit" with **Retry** / **Discard**.
- Retries are safe: every photo has a fixed path (upsert), photos already uploaded are skipped, and a
  re-sent snag or photo insert that already reached the database is recognised rather than duplicated.
- Snags saved with a single photo before multi-photo support keep that photo as photo 1 (migrated, and
  handled in code for any row the migration didn't cover).

## PDF report

"Generate report" on a project page opens report options, then builds the PDF in the browser (`src/lib/pdf/`).

**Options, chosen each time:**

| Option | Choices |
|---|---|
| Design | **Standard table** (every snag, small photo) · **Photo report** (large photo per snag, for clients) · **Checklist** (no photos, tick box + initials per snag and a sign-off block, for trades) |
| Which snags | All · Outstanding (open + in progress) · Resolved |
| Assigned to | Any combination of the project's assignees (including Unassigned); none selected = everyone |
| Group by | None · By trade · By status (a heading per group, never left alone at the foot of a page) |
| Prepared for / by | Optional names shown in the header |

The screen shows exactly how many snags the report will include. Design, grouping and "prepared by" are
remembered on the device; the filters reset each time. Filters in use are noted in the PDF header, and the
file name reflects the design and a single selected trade (e.g. `snag-checklist-plot-14-plumber-2026-11-10.pdf`).

Every design has the project name, date and status totals in the header, a "Page x of y" footer, and rows
or cards that never split across pages.
- Built with `@react-pdf/renderer`, so text is sharp and selectable (not a screenshot). The PDF engine
  is loaded only when the button is tapped.
- Photos are downloaded and sized for the design, so reports stay small enough to email. The table shows
  each snag's cover at 320 px with "+N more photos"; the photo report shows the cover at 1000 px with the
  other photos in a row underneath (480 px); the checklist has none.
  A photo that fails to load is skipped and reported; it doesn't stop the report.
- Data is read fresh from the database, and the button is disabled while snags are still saving.

Limits: the built-in Helvetica font covers Western European characters; emoji or other scripts in snag
text won't render. Registering a Unicode font in `snag-report.tsx` would fix that.

## Deployment

Live at **https://snaglist-rosy.vercel.app** (Vercel project `snaglist`, team `snag-list-deploy`).

- The Vercel project has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set for all environments.
- Linked to GitHub (`craigwaters1986-ux/claude`). Every push to `claude/affectionate-pascal-ga9bf4`, the
  production branch, deploys to the live address automatically; pushes to other branches get preview URLs.
  If this work is merged into `main`, change the production branch in Vercel → Project → Settings → Git.
- In Supabase → Authentication → URL Configuration, **Site URL** must be `https://snaglist-rosy.vercel.app`
  and **Redirect URLs** must include `https://snaglist-rosy.vercel.app/auth/callback`.
