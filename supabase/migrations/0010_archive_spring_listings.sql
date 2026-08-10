-- 0010: September-window reset — archive all spring (May–July) listings.
--
-- The board and calendar only show status = 'active', so this hides the stale
-- May/June listings without deleting anything. The profile form still pre-checks
-- these courses (it reads listings regardless of status) and saving the profile
-- recreates them as fresh active listings — that IS the repost flow. People who
-- never come back simply stay off the board.

update public.listings
set status = 'closed'
where status = 'active'
  and created_at < '2026-08-01';
