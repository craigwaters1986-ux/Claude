# Site Auditor + — Building-site snagging app

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
| `levels` | `id`, `project_id` → projects (cascade), `name`, `position`, `drawing_url` / `drawing_path`, `drawing_width` / `drawing_height`. A floor or area, with one drawing. |
| `snags` (location) | `level_id` → levels (set null on delete), `pin_x` / `pin_y`: the pin as fractions (0–1) of the drawing's width and height. |
| `user_state` | One row per user: last `project_id`, `view` (list/plans), `level_id`, `device`. Powers "Continue where you left off" across devices. |
| `user_settings` | One row per user: `settings` JSON (theme, accent, text size, list layout, company name, logo, default "prepared by"). Synced to every device; invalid or unknown values fall back to defaults. |
| `snag_photos` | `id`, `snag_id` → snags (cascade), `position`, `image_url`, `image_path`, `created_at`. Up to 6 per snag in the app (12 enforced by the database). |
| `project_summaries` (view) | every project column + `total_snags`, `open_snags`, `in_progress_snags`, `resolved_snags` |

Design notes:

- **Three-line snags.** Each snag is up to six photos plus title, assigned to (a trade or person, free
  text) and comments. New snags start as Open; status is changed from the project list.
- **Friendly snag numbers.** UUIDs are the real keys, but clients want "Snag #14". A trigger hands out
  numbers from a per-project counter with a row lock, so rapid back-to-back inserts never collide.
  Numbers always run 1, 2, 3… with no gaps: after a delete, the database renumbers the project's remaining
  snags in their existing order and resets the counter (`renumber_project_snags`, in the same lock, so a
  snag added at the same moment still gets the next number). Only the database can change a number.
  A report printed before a delete may therefore show different numbers for later snags.
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
| `/projects/[projectId]/add` | **Rapid Entry**: up to 6 photos + three lines (title, assigned to, comments) → "Save & add next", repeat. Or **Several at once** (below) |
| `/settings` | Settings (Account menu → Settings): appearance, report branding, list layout |

**Phones and laptops.** The same app adapts to the screen. On tablets and laptops (≥ 768 px) a project's
snags can be shown as a **table** (remembered per device; phones always use cards). On laptops (≥ 1024 px):
projects in a grid, the project page has a side panel with the snags beside it, Add snags puts photos and
details side by side, photos can be **dragged and dropped** onto Add snags, **Ctrl/⌘ + Enter** saves, and
**← / →** move between photos in a snag. Every project page has a snag search (title, trade, comments, #).

Signed-out visitors are sent to `/login?next=…` and returned to the page they wanted after signing in.
UI components in `src/components/ui/` are standard shadcn/ui sources.

## Settings and dark mode

Account menu → **Settings**. Saved to `user_settings`, so they follow you to every device (and are kept on
the device too, so they apply before sign-in and offline).

- **Theme:** Light · Dark · Automatic (follows the phone or laptop). An inline script in `<head>` applies it
  before the first paint, so there's no white flash. The top bar stays black in both.
- **Accent colour:** yellow, orange, green, blue or pink (buttons, highlights, logo tile).
- **Text size:** Standard or Larger (scales the whole app by 112.5%).
- **Snag list:** Table or Cards on tablets and laptops.
- **Reports:** company name and logo printed on every report, and a default "Prepared by".

## Adding several snags at once

On Add snags, switch to **Several at once** (the choice is remembered on the device):

1. Set what the batch shares: Assigned to, Level and Comments.
2. Add rows: **From photos** (one snag per photo), **Take photo**, or type a list (one snag per line;
   bullets and numbers are stripped). Up to 50 rows.
3. On each row: give it a title, add more photos, change who it's assigned to, and drop a pin on the drawing.
4. **Save N snags** saves them in order through the same offline outbox as single entry.

Dragging photos onto the page only works in single mode for now.

## Marking up photos

Tap the pencil on any photo to draw on it: **pen**, **arrow**, **circle**, **box** and **text** labels in red,
yellow, blue, white or black, with **Undo**. Marks have a thin contrasting outline so they show on light and
dark surfaces, and their size scales with the photo.

- **Before saving** (single entry and each batch row's main photo): the marked-up copy replaces the photo on
  the device, so it saves and uploads exactly like any other photo, including with no signal.
- **Saved photos** (snag detail): the marked-up copy is uploaded under a new file name, the photo record is
  pointed at it and the old file is deleted. This needs signal; the original is untouched if it fails.

Marks are flattened into the JPEG (`src/lib/image/annotate.ts`), so they appear everywhere: lists, other
devices and PDF reports. Editing again adds to the marked-up copy; the unmarked original isn't kept.

## Rapid Entry, offline saving & photo uploads

**Snags are saved on the device first, then uploaded.** "Save & add next" writes the snag and its photos
to an **outbox** in IndexedDB (`src/lib/offline/outbox-db.ts`) and clears the form. A sync engine
(`src/lib/offline/outbox.ts`) uploads the outbox, oldest first, whenever there's signal:

1. **Compress** each photo (canvas, 1920 px, JPEG 0.8, EXIF rotation applied); the smaller copy replaces
   the original in the outbox.
2. **Upload** it to `snag-images/{userId}/{projectId}/{snagId}/{photoId}.jpg` (XMLHttpRequest, for progress).
3. **Create** the snag and its photo rows. Only then is the entry removed from the outbox.

Each step is recorded in the outbox as it completes, and every step is idempotent (client ids, fixed
paths, duplicate inserts recognised), so a retry never repeats work or duplicates anything.

- **No signal / weak signal:** the entry stays "waiting" and retries with growing pauses (3 s → 90 s),
  and immediately when the signal returns or the app comes back to the foreground. Nothing is lost if
  the page reloads, the tab is closed or the phone restarts.
- **Refused by the server** (e.g. its project was deleted): marked "not saved" and kept until the user
  retries or discards it. Never silently dropped.
- **Order:** uploads stop at the first network failure, so snag numbers follow the order logged.
- **Visibility:** waiting snags appear in the project's list, table and plans ("On this phone · uploads
  when there's signal"); the top bar shows "N to upload" / "N not saved".

**The app opens with no signal.** A service worker (`public/sw.js`) keeps app code (cache-first), each
page as it's opened plus the project's Add snags page (network-first, 4 s timeout), and photos/drawings
(cache-first; drawings are saved as soon as a project is opened). Loaded projects, snags and levels are
kept in localStorage (TanStack Query persister) and refreshed from the server when back online.

Limits: a page must have been opened once with signal on that device to open offline. iPhones may clear a
site's stored data if it isn't used for about a week, so open the app with signal within a few days to
upload anything waiting.

## PDF report

"Generate report" on a project page opens report options, then builds the PDF in the browser (`src/lib/pdf/`).

**Options, chosen each time:**

| Option | Choices |
|---|---|
| Design | **Standard table** (every snag, small photo) · **Photo report** (large photo per snag, for clients) · **Checklist** (no photos, tick box + initials per snag and a sign-off block, for trades) |
| Which snags | All · Outstanding (open + in progress) · Resolved |
| Assigned to | Any combination of the project's assignees (including Unassigned); none selected = everyone |
| Group by | None · By trade · By status (a heading per group, never left alone at the foot of a page) |
| Prepared for / by | Optional names shown in the header ("by" defaults to the one in Settings) |
| Show where each snag is | Shown when the project has drawings: a small cut-out of the drawing around each pinned snag, with the pin and level name, in every design |

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

## Drawings, levels and pins

A project can have **levels** (Ground, First, Roof …), each with one drawing. On the project page,
**Snags | Plans** switches between the list and the drawings.

- **Upload:** PDF or image. It is converted in the browser to one JPEG (longest edge 3200 px) with
  pdf.js (`src/lib/drawings/prepare.ts`); for a multi-page PDF you choose the page. Stored at
  `snag-images/{userId}/{projectId}/drawings/{levelId}/{uuid}.jpg`.
- **Pin a snag:** in Add snags or a snag's detail, pick the level and tap the plan. The level stays
  selected between snags; the pin is per snag. Pins are stored as fractions, so they stay on the same
  spot at any zoom and on any screen.
- **Plans view:** pinch/scroll to zoom, drag to pan; pins are numbered and coloured by status and open
  the snag. The status filter and search apply to pins.
- **New revision:** replacing a level's drawing keeps its pins (they assume the same sheet layout).
- **Deleting a level** keeps its snags and clears their level and pin.
- **Reports:** snags show their level; group by level; optional marked-up plan page per level.

## Phone ↔ laptop

The same account works on any number of devices, each staying signed in until you sign out.

- **Sign-in:** email link / 6-digit code, or **password** once set (Account menu → Set password). The
  device remembers the email and the method used last. "Forgot password?" sends a sign-in email.
- **Continue where you left off:** the project page saves where you are (project, Snags/Plans, level,
  device) to `user_state` shortly after you settle. The Projects page shows a Continue card for the last
  place on any device. Project pages are linkable: `/projects/{id}?view=plans&level={levelId}`.
- **Most recent first:** projects are ordered by `last_activity_at` (project, snags, photos, levels).
- **Live updates:** `projects`, `snags`, `snag_photos` and `levels` are published to Supabase Realtime
  (`src/hooks/use-live-updates.ts`). An open page refetches when another device changes something, so new
  snags logged on site appear on the laptop within a second or two. RLS applies, and a device's own capture
  burst finishes before it refetches. A green "Live" dot shows on the project page while connected.
