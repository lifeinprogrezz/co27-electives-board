-- Add the two EMBA Summer electives Co27 students can enroll in.
-- Both run Thu Jul 9 (08:30-19:30 with breaks) + Fri Jul 10 (08:30-13:30) — same slot,
-- so a student can take ONE of them (not both). 1.5 ECTS each per the EMBA elective rule.

insert into public.courses (class_code, name, ects, professor, term, schedule_text, slot, notes) values
  (
    null,
    'Monetization (EMBA)',
    1.5,
    'Marco Bertini',
    'summer',
    'Jul 9 AM+PM, Jul 10 AM',
    'AM+PM',
    'EMBA elective — students may enroll in only one EMBA Summer elective. Capitalizing on Customer Satisfaction to Drive Organic Growth.'
  ),
  (
    null,
    'Digital Strategy & Transformation (EMBA)',
    1.5,
    'Wim Vanhaverbeke',
    'summer',
    'Jul 9 AM+PM, Jul 10 AM',
    'AM+PM',
    'EMBA elective — students may enroll in only one EMBA Summer elective.'
  )
on conflict (name, term) do nothing;
