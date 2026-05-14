-- Co27 Electives Trading Board — initial schema, RLS, and signup trigger.

-- =============================================================================
-- Enums
-- =============================================================================
create type term_t as enum ('summer', 'september', 'term4');
create type slot_t as enum ('AM', 'PM', 'AM+PM', 'online', 'fri-pm', 'special');
create type listing_type_t as enum ('have_want_drop', 'want_add');
create type listing_status_t as enum ('active', 'closed');

-- =============================================================================
-- users (mirrors auth.users, restricted to @esade.edu)
-- =============================================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null check (lower(email) like '%@esade.edu'),
  name text,
  whatsapp_number text,
  cohort_section smallint check (cohort_section in (1, 2, 3)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- courses
-- =============================================================================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  class_code text,
  name text not null,
  ects numeric(3,1) not null check (ects in (1.5, 3)),
  professor text,
  term term_t not null,
  schedule_text text,
  slot slot_t,
  notes text,
  created_at timestamptz not null default now()
);

create unique index courses_name_term_uidx on public.courses(name, term);
create index courses_term_idx on public.courses(term);

-- =============================================================================
-- listings
-- =============================================================================
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  type listing_type_t not null,
  status listing_status_t not null default 'active',
  created_at timestamptz not null default now(),
  unique (user_id, course_id, type)
);

create index listings_board_idx on public.listings(course_id, type, status);
create index listings_user_idx on public.listings(user_id);

-- =============================================================================
-- updated_at trigger
-- =============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- Auto-create public.users row from auth.users (security definer; runs as superuser)
-- =============================================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =============================================================================
-- Row-level security
-- =============================================================================
alter table public.users    enable row level security;
alter table public.courses  enable row level security;
alter table public.listings enable row level security;

-- users: any authenticated user can read the directory; only self can modify
create policy users_select_authenticated
  on public.users for select
  to authenticated
  using (true);

create policy users_update_self
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy users_delete_self
  on public.users for delete
  to authenticated
  using (id = auth.uid());
-- (no insert policy; the security-definer trigger handles inserts)

-- courses: public read (landing page may preview); writes only via service role
create policy courses_select_all
  on public.courses for select
  to anon, authenticated
  using (true);

-- listings: read by any authenticated; write only by owner
create policy listings_select_authenticated
  on public.listings for select
  to authenticated
  using (true);

create policy listings_insert_self
  on public.listings for insert
  to authenticated
  with check (user_id = auth.uid());

create policy listings_update_self
  on public.listings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy listings_delete_self
  on public.listings for delete
  to authenticated
  using (user_id = auth.uid());
