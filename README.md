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
| `snags` | `id`, `project_id` → projects, `snag_number` (per-project #1, #2…), `title`, `assigned_to`, `description` (shown as "Comments"), `status` (`open` / `in_progress` / `resolved`), `image_url`, `image_path`, `resolved_at`, `created_at`. `location_details` remains for older rows but the form no longer asks for it. |
| `project_summaries` (view) | every project column + `total_snags`, `open_snags`, `in_progress_snags`, `resolved_snags` |

Design notes:

- **Three-line snags.** Each snag is a photo plus title, assigned to (a trade or person, free text) and
  comments. New snags start as Open; status is changed from the project list.
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
| `/projects/[projectId]` | Project header + counts, status filter tabs, snag list (change status, delete) |
| `/projects/[projectId]/add` | **Rapid Entry**: photo + three lines (title, assigned to, comments) → "Save & add next", repeat |

Signed-out visitors are sent to `/login?next=…` and returned to the page they wanted after signing in.
UI components in `src/components/ui/` are standard shadcn/ui sources.

## Rapid Entry & photo uploads

Each "Save & add next" starts one background job (`useCreateSnag` in `src/hooks/use-snags.ts`)
and clears the form at once:

1. **Compress** (`src/lib/image/compress.ts`): canvas resize to 1920 px longest edge, JPEG at 0.8,
   EXIF rotation applied, transparent PNGs flattened onto white. Typically 2–5 MB becomes 300 KB.
   No third-party library, so nothing is fetched from a CDN on a weak connection.
2. **Upload** (`src/lib/services/storage.ts`): to `snag-images/{userId}/{projectId}/{snagId}.jpg` via
   XMLHttpRequest, because `fetch` can't report upload progress.
3. **Save** the snag row; the database assigns its number.

Behaviour on site:
- Captures run one at a time, in the order logged, so snag numbers follow the walk-round.
- The snag appears in the project list straight away with its local photo, marked "Saving…".
- Leaving the page doesn't stop uploads. Closing the tab mid-upload asks for confirmation.
- Network errors retry 3 times with backoff; offline captures wait and resume when signal returns.
  Anything that still fails stays in "Logged this visit" with **Retry** / **Discard**.
- Retries are safe: the photo path is fixed per snag (upsert), and a re-sent insert that already
  reached the database is recognised rather than duplicated.

## PDF report

"Generate report" on a project page builds the PDF in the browser (`src/lib/pdf/`):

- **Header:** project name, location, description, report date, and totals (total / open / in progress / resolved).
- **Table:** #, photo thumbnail, title, assigned to, comments, status. The table header repeats on every
  page, rows never split across pages, and each page has a "Page x of y" footer.
- Built with `@react-pdf/renderer`, so text is sharp and selectable (not a screenshot). The PDF engine
  is loaded only when the button is tapped.
- Photos are downloaded and shrunk to thumbnails first, so a long report stays small enough to email.
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
