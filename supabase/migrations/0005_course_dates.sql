-- Add structured date columns to courses so /calendar can render Gantt bars.
-- schedule_text remains the human-readable source; these are parsed/curated.
alter table public.courses
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists session_dates date[] not null default '{}';

-- Useful for date-range queries.
create index if not exists courses_dates_idx on public.courses(start_date, end_date);
