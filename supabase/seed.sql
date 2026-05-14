-- Course catalog seed (re-runnable thanks to ON CONFLICT on (name, term)).
-- Class codes marked NULL are TBD; backfill from the official ESADE catalog PDF.

insert into public.courses (class_code, name, ects, professor, term, schedule_text, slot, notes) values
-- Summer Term — June-July 2026, Barcelona, in-person unless noted
('4099',  'Advanced Communication Skills (June)',           3,   'Lola Martínez',          'summer', 'Jun 15-18 AM+PM',                                'AM+PM',  null),
(null,    'Berlin Study Tour',                              3,   null,                     'summer', 'Jun 15-19',                                       'AM+PM',  null),
(null,    'International Tax Planning',                     1.5, null,                     'summer', 'Jun 15-18 AM',                                    'AM',     null),
(null,    'Transforming Corporate Operations',              1.5, null,                     'summer', 'Jun 15-18 PM',                                    'PM',     null),
('11127', 'Social Entrepreneurship & Impact Economy',       3,   'Hehenberger',            'summer', 'Jun 22-26 AM+PM (skip Wed)',                      'AM+PM',  null),
('4185',  'Re-Imagining Capitalism',                        3,   null,                     'summer', 'Jun 22-26 AM+PM',                                 'AM+PM',  null),
('4194',  'Venture Capital & Entrepreneurial Finance',      3,   'Corrales',               'summer', 'Jun 29 - Jul 2 AM+PM',                            'AM+PM',  null),
('4211',  'Transforming the Family Business',               1.5, null,                     'summer', 'Jun 29 - Jul 2 AM',                               'AM',     null),
('11124', 'AI in our Lives: Behavioral Science of AI',      1.5, 'Valenzuela',             'summer', 'Jun 29 - Jul 2 PM',                               'PM',     null),
('11146', 'AI, Entrepreneurship & Innovation',              1.5, 'Marc Cortés',            'summer', 'Jul 6, 7, 9, 10 AM',                              'AM',     null),
(null,    'Operations, Innovation & Data Science',          1.5, null,                     'summer', 'Jul 6-9 AM',                                      'AM',     null),
('4208',  'Entrepreneurial & Innovative Growth Strategies', 1.5, 'Francesco Di Lorenzo',   'summer', 'Jul 6-9 PM',                                      'PM',     null),
('4195',  'Advanced Corporate Finance',                     3,   null,                     'summer', 'Jul 6-9 + Jul 13-16 AM',                          'AM',     null),
(null,    'International Portfolio Management',             3,   null,                     'summer', 'Jul 6-9 + Jul 13-16 PM',                          'PM',     null),
('4212',  'Global Risks in the 21st Century',               3,   'Ángel Pascual Ramsay',   'summer', 'Jul 13-16 AM+PM',                                 'AM+PM',  null),
('11144', 'Action Learning Consultancy Project',            3,   'Juan Carlos García',     'summer', 'Fri PM: Jul 3, 10, 17',                           'fri-pm', null),
('4213',  'Modern Spain and Catalunya',                     1.5, 'Alex Fernández de Castro','summer', 'Fri PM: Jun 19 + Jul 3, 10, 17',                  'fri-pm', 'Online with synchronous group work'),
('11145', 'Introduction to Python',                         1.5, 'Esteve Almirall',        'summer', 'Online async, Jun 25 - Jul 25',                   'online', null),
(null,    'The Startup Experience / Start-Up Program',      3,   'Jan Brinckmann + Davide Rovera', 'summer', 'Mid-Jun to mid-Oct',                       'special','10-20h/wk, special structure'),

-- September (Term 4 Intensive)
('5456',  'Impact Investing in Action',                     3,   'Casasnovas + Hehenberger','september', 'Sep 14-18 AM+PM',                              'AM+PM',  null),
(null,    'Brand-Driven Strategy Management',               3,   'Iglesias',               'september', 'Sep 7-10 + Sep 14-17 AM',                       'AM',     null),
(null,    'Hypergrowth in StartUps',                        1.5, 'Davide Rovera',          'september', 'Sep 21-22 AM+PM',                               'AM+PM',  null),
(null,    'Advanced Communication Skills (Sept)',           1.5, 'Lola Martínez',          'september', 'Sep 7-10 AM',                                   'AM',     null),
(null,    'Building Scenarios',                             1.5, null,                     'september', 'Sep 21-22',                                     'special',null),

-- Term 4 (October-December 2026, mostly online)
('3638',  'Python for Data Analysis',                       3,   'Esteve Almirall',        'term4', 'Oct 1 - Dec 12, online self-paced',                 'online', null),
(null,    'Entrepreneurship through Acquisition',           1.5, 'Bartomeus + Corrales',   'term4', 'Oct 27-30 PM',                                      'PM',     null),
(null,    'Introduction to Consultancy',                    1.5, 'Coyne',                  'term4', 'Oct 6-9 AM',                                        'AM',     null),
(null,    'Leading Organizations',                          1.5, 'Correa',                 'term4', 'Nov 12-26 AM',                                      'AM',     null),
(null,    'AI for Productivity and Personal Development',   1.5, null,                     'term4', 'Nov 30 - Dec 4 AM',                                 'AM',     null)
on conflict (name, term) do nothing;
