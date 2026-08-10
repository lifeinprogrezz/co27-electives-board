-- 0011: September-window reset, part 2 — clear everyone's assigned courses.
--
-- Spring assignments changed during Add/Drop and over the summer, so the
-- stored assigned_course_ids are stale guesses. Companion to 0010: archived
-- listings no longer pre-check the profile form, and this wipes the assigned
-- list, so returning users rebuild their real schedule from a blank slate.
-- Onboarding is unaffected (completeness only checks name).

update public.users
set assigned_course_ids = '{}'
where assigned_course_ids is not null
  and assigned_course_ids <> '{}';
