-- Adds the 4 EMBA Madrid Summer electives + a syllabus_url column.
-- Source: "info timetable EMBA Summer Term Co27.pdf" (campus=MADRID rows).
--
-- All four are EMBA electives — students may enrol in ONLY ONE EMBA Summer
-- elective across Barcelona + Madrid offerings (constraint stated in eCampus).
-- ECTS mirrors the Barcelona EMBA pair (Monetization, Digital Strategy) = 1.5.

alter table public.courses
  add column if not exists syllabus_url text;

insert into public.courses (class_code, name, ects, professor, term, schedule_text, slot, notes) values
  (null,
   'Sales Management (EMBA Madrid)',
   1.5,
   'Marco Aurelio Sisti',
   'summer',
   'Jun 25, 26 AM+PM',
   'AM+PM',
   'EMBA Madrid elective — students may enrol in only one EMBA Summer elective. Thu 25 Jun AM+PM, Fri 26 Jun AM. Campus: Madrid.'),

  (null,
   'Fundamentals of Corporate Investment Banking & Asset Management (EMBA Madrid)',
   1.5,
   'Joseph Zacharioudakis',
   'summer',
   'Jul 16, 17 AM+PM',
   'AM+PM',
   'EMBA Madrid elective — students may enrol in only one EMBA Summer elective. Thu 16 Jul AM+PM, Fri 17 Jul AM. A practitioner''s guide. Campus: Madrid.'),

  (null,
   'People Management and Development (EMBA Madrid)',
   1.5,
   'Jordi Trullen',
   'summer',
   'Jul 16, 17 AM+PM',
   'AM+PM',
   'EMBA Madrid elective — students may enrol in only one EMBA Summer elective. Thu 16 Jul AM+PM, Fri 17 Jul AM. Campus: Madrid.'),

  (null,
   'Driving Business Performance: Maps & Measures (ed.2) (EMBA Madrid)',
   1.5,
   'Alexander Ylla',
   'summer',
   'Jul 17, 18 AM+PM',
   'AM+PM',
   'EMBA Madrid elective — students may enrol in only one EMBA Summer elective. Fri 17 Jul PM, Sat 18 Jul AM+PM. Campus: Madrid.')
on conflict (name, term) do nothing;

-- Backfill calendar dates so the new rows render on the Gantt.
-- (parse-schedule.mjs reads schedule_text → start/end/session_dates; encoding
-- the dates here keeps the migration self-contained.)
update public.courses
  set start_date = '2026-06-25',
      end_date   = '2026-06-26',
      session_dates = array['2026-06-25','2026-06-26']::date[]
  where name = 'Sales Management (EMBA Madrid)';

update public.courses
  set start_date = '2026-07-16',
      end_date   = '2026-07-17',
      session_dates = array['2026-07-16','2026-07-17']::date[]
  where name = 'Fundamentals of Corporate Investment Banking & Asset Management (EMBA Madrid)';

update public.courses
  set start_date = '2026-07-16',
      end_date   = '2026-07-17',
      session_dates = array['2026-07-16','2026-07-17']::date[]
  where name = 'People Management and Development (EMBA Madrid)';

update public.courses
  set start_date = '2026-07-17',
      end_date   = '2026-07-18',
      session_dates = array['2026-07-17','2026-07-18']::date[]
  where name = 'Driving Business Performance: Maps & Measures (ed.2) (EMBA Madrid)';
