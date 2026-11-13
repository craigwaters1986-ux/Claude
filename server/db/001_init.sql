-- Forma sync schema (Postgres 14+). Applied by server/src/store.ts migrate().
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  apple_sub   text unique,             -- Sign in with Apple stable user id
  dev_device  text unique,             -- development sign-in only
  created_at  timestamptz not null default now()
);

create sequence if not exists record_seq;

-- One row per synced entity. payload is the app's own JSON (WorkoutRecord, template, …).
create table if not exists records (
  user_id     uuid not null references users(id) on delete cascade,
  kind        text not null check (kind in ('workout','template','customExercise','profile')),
  id          text not null,
  payload     jsonb,
  updated_at  bigint not null,          -- client clock (ms) used for last-writer-wins
  deleted     boolean not null default false,
  seq         bigint not null default nextval('record_seq'),   -- server change cursor
  primary key (user_id, kind, id)
);
create index if not exists records_user_seq on records (user_id, seq);
