-- Drop cohort_section (not used for filtering/matching, just an extra field gating onboarding).
-- Add assigned_course_ids[] — the user's initial allocation, so the profile UI can scope
-- "Drop" to assigned courses and "Add" to unassigned courses.

alter table public.users
  drop column if exists cohort_section;

alter table public.users
  add column if not exists assigned_course_ids uuid[] not null default '{}';

-- Optional integrity check: every assigned course id must exist in public.courses.
-- Enforced with a trigger because PG doesn't support FK constraints on array elements.
create or replace function public.check_assigned_course_ids()
returns trigger language plpgsql as $$
declare
  bad uuid;
begin
  if new.assigned_course_ids is null or array_length(new.assigned_course_ids, 1) is null then
    return new;
  end if;
  select id into bad
    from unnest(new.assigned_course_ids) as t(id)
    where id not in (select id from public.courses);
  if bad is not null then
    raise exception 'assigned_course_ids contains unknown course %', bad;
  end if;
  return new;
end; $$;

drop trigger if exists users_check_assigned_courses on public.users;
create trigger users_check_assigned_courses
  before insert or update of assigned_course_ids on public.users
  for each row execute function public.check_assigned_course_ids();
