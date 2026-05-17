-- Complete the Co27 elective catalog from the official Schedule PDF + eCampus HTML.
-- Source of truth: SCHEDULE Electives MBA Co27.pdf. eCampus HTML cross-checked.
--
-- Scope decisions (see memory: project-catalog-decisions):
--   - Study tours (Berlin, China, Dubai, London) are NOT in the marketplace —
--     separate selection process. Dubai + London were cancelled (war) anyway.
--   - Languages (Spanish/French/German placeholder) stays out — not in the bid pool.
--   - EMBA Summer rows (Monetization + Digital Strategy & Transformation) are kept
--     since students can take ONE of them per Summer.
--
-- This migration:
--   1. Removes the bogus "Operations, Innovation & Data Science" row in summer
--      (a dept name had leaked into a course row in the seed).
--   2. Inserts the 31 missing courses across september / term4 / term5.

delete from public.courses
where term = 'summer'
  and name = 'Operations, Innovation & Data Science';

insert into public.courses (class_code, name, ects, professor, term, schedule_text, slot, notes) values
-- =========================================================================
-- SEPTEMBER term (Aug 24 - Sept 23, 2026) — 4 missing
-- =========================================================================
(null, 'Advanced Competitive Strategy',     3,   'Kevin Coyne',                  'september', '24-27 Aug & 31 Aug - 3 Sep AM', 'AM',    'eCampus lists this as "Advaced Competitive Strategy"; corrected spelling here.'),
(null, 'Brand Strategy',                    3,   'Andrés Cúneo',                 'september', '24-27 Aug & 31 Aug - 3 Sep AM', 'AM',    null),
(null, 'Alternative Investments',           3,   'Jorge Martín',                 'september', '31 Aug - 3 Sep & 7-10 Sep PM',  'PM',    null),
(null, 'Leading the New Luxury',            3,   'Egle Toia',                    'september', '14-18 Sep & 21-23 Sep PM',      'PM',    null),

-- =========================================================================
-- TERM 4 — Module 1 (October 2026) — 6 missing
-- =========================================================================
(null, 'Protecting your Well-being as a Founder/Leader',     1.5, 'Annelore Huyghe',              'term4', '28-30 Sep AM',                 'AM',    null),
(null, 'Marketing Strategy in the AI Age',                   3,   'Pau Virgili',                  'term4', '28 Sep & 5, 19, 26 Oct AM+PM', 'AM+PM', null),
(null, 'B2B Sales Management',                               1.5, 'Oscar Torres',                 'term4', '8 & 9 Oct AM+PM',              'AM+PM', null),
(null, 'Crypto & Blockchain',                                1.5, 'Torsten Dennin',               'term4', '13-16 Oct AM',                 'AM',    'New trends in the economy and in asset & wealth management.'),
(null, 'Business Transformation, AI & IoT',                  1.5, 'Jorge Calvo',                  'term4', '20-23 Oct AM',                 'AM',    'Enabling technologies for business transformation.'),
(null, 'Competing and Winning in the Age of Generative AI',  1.5, 'Esteve Almirall',              'term4', '27-30 Oct AM',                 'AM',    null),

-- =========================================================================
-- TERM 4 — Module 2 (Nov-Dec 2026) — 6 missing
-- =========================================================================
(null, 'Power and Influence',                                3,   'José M. de Areilza',           'term4', '2, 9, 16 & 23 Nov AM+PM',      'AM+PM', null),
(null, 'Building Conscientious Brands',                      1.5, 'Nicholas Ind',                 'term4', '3 & 5 Nov AM+PM',              'AM+PM', null),
(null, 'Business Strategy Game',                             3,   'Bilgehan Uzunca',              'term4', '3-26 Nov PM (8 sessions)',     'PM',    'Competing in Global Marketplace.'),
(null, 'Racial (In)Justice',                                 1.5, 'Rita Mota',                    'term4', '4, 11, 18 & 25 Nov AM',        'AM',    null),
(null, 'Mergers & Acquisitions',                             3,   'Santiago Simón',               'term4', '6, 13, 20 & 27 Nov AM+PM',     'AM+PM', null),
(null, 'Sports Business Management',                         3,   'Carlos Cantó, Keegan Pierce',  'term4', '6, 13, 20 & 27 Nov AM+PM',     'AM+PM', null),

-- =========================================================================
-- TERM 5 — Module 1 (Jan-Feb 2027) — 9 missing
-- =========================================================================
(null, 'New Trends in Sustainable and Regenerative Business', 1.5, 'Maja Tampe / Marc Vilanova',  'term5', '7 & 8 Jan AM+PM',            'AM+PM', 'Schedule PDF lists Maja Tampe; eCampus lists Marc Vilanova — keeping both until ESADE clarifies.'),
(null, 'Managing Digital Banking and Fintech',                3,   'Xavier Busquets, Eloi Noya',  'term5', '11-14 Jan AM+PM',            'AM+PM', null),
(null, 'In Search of Principles for a Life Philosophy',       3,   'Ferran Macipe, Marc Vilanova','term5', '11-14 Jan AM+PM',            'AM+PM', null),
(null, 'B2B Marketing',                                       3,   'Peter Brown',                 'term5', '18-21 & 25-28 Jan AM',       'AM',    null),
(null, 'Geopolitics',                                         1.5, 'David Murillo',               'term5', '18, 19 & 21, 22 Jan PM',     'PM',    null),
(null, 'Consumer Data Analytics',                             3,   'Ioannis Evangelidis',         'term5', '25-28 Jan AM+PM',            'AM+PM', null),
(null, 'Understanding Where You Are',                         1.5, 'Alex Fernández de Castro',    'term5', '29, 30 Jan & 5, 6 Feb PM',   'PM',    null),
(null, 'Behavioral Economics',                                3,   'Pedro Rey',                   'term5', '1-5 Feb AM+PM',              'AM+PM', null),
(null, 'Advanced Negotiation Tactics',                        1.5, 'Jordi Quoidbach',             'term5', '1 & 2 Feb AM+PM',            'AM+PM', null),

-- =========================================================================
-- TERM 5 — Module 2 (Feb-Mar 2027) — 6 missing
-- =========================================================================
(null, 'Performance Measurements and Control Systems',                       3,   'Josep Bisbe',          'term5', '8, 15, 22 Feb & 1 Mar AM+PM', 'AM+PM',   null),
(null, 'Thinking with Data',                                                 1.5, 'Uri Simonsohn',        'term5', 'TBD',                          'special', 'New course; dates TBD per the official schedule.'),
(null, 'Innovation with Brain-Pleasing Marketing',                           1.5, 'Lluis Martinez-Ribes', 'term5', '9-12 Feb AM',                  'AM',      null),
(null, 'Learning Stakeholder Management through Theater',                    1.5, 'Daniel Arenas',        'term5', '9-12 Feb PM',                  'PM',      null),
(null, 'Strategic Corporate Governance from an International Perspective',   1.5, 'Ruth Aguilera',        'term5', '16-19 Feb AM',                 'AM',      null),
(null, 'Rights for Robots',                                                  1.5, 'Rita Mota',            'term5', '2 & 3 Mar AM+PM',              'AM+PM',   null)

on conflict (name, term) do nothing;
