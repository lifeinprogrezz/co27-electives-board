-- Normalize schedule_text on the 31 courses added by 0007 so that
-- scripts/parse-schedule.mjs can derive start_date/end_date/session_dates.
--
-- Conventions (already used by the original seed):
--   • Month names come BEFORE day numbers ("Sep 14-18", not "14-18 Sep").
--   • Multiple date ranges are joined by " + " (not "&").
--   • Comma lists follow the anchor month ("Nov 2, 9, 16, 23").
--   • AM / PM / AM+PM time markers come at the end.
--
-- Also expands "Business Strategy Game" from the placeholder "3-26 Nov PM
-- (8 sessions)" into the real 8 PDF-listed session dates.

update public.courses set schedule_text = 'Aug 24-27 + Aug 31 - Sep 3 AM'         where term = 'september' and name = 'Advanced Competitive Strategy';
update public.courses set schedule_text = 'Aug 24-27 + Aug 31 - Sep 3 AM'         where term = 'september' and name = 'Brand Strategy';
update public.courses set schedule_text = 'Aug 31 - Sep 3 + Sep 7-10 PM'          where term = 'september' and name = 'Alternative Investments';
update public.courses set schedule_text = 'Sep 14-18 + Sep 21-23 PM'              where term = 'september' and name = 'Leading the New Luxury';

update public.courses set schedule_text = 'Sep 28-30 AM'                          where term = 'term4' and name = 'Protecting your Well-being as a Founder/Leader';
update public.courses set schedule_text = 'Sep 28 + Oct 5, 19, 26 AM+PM'          where term = 'term4' and name = 'Marketing Strategy in the AI Age';
update public.courses set schedule_text = 'Oct 8, 9 AM+PM'                        where term = 'term4' and name = 'B2B Sales Management';
update public.courses set schedule_text = 'Oct 13-16 AM'                          where term = 'term4' and name = 'Crypto & Blockchain';
update public.courses set schedule_text = 'Oct 20-23 AM'                          where term = 'term4' and name = 'Business Transformation, AI & IoT';
update public.courses set schedule_text = 'Oct 27-30 AM'                          where term = 'term4' and name = 'Competing and Winning in the Age of Generative AI';

update public.courses set schedule_text = 'Nov 2, 9, 16, 23 AM+PM'                where term = 'term4' and name = 'Power and Influence';
update public.courses set schedule_text = 'Nov 3, 5 AM+PM'                        where term = 'term4' and name = 'Building Conscientious Brands';
update public.courses set schedule_text = 'Nov 3, 5, 10, 12, 17, 19, 24, 26 PM'   where term = 'term4' and name = 'Business Strategy Game';
update public.courses set schedule_text = 'Nov 4, 11, 18, 25 AM'                  where term = 'term4' and name = 'Racial (In)Justice';
update public.courses set schedule_text = 'Nov 6, 13, 20, 27 AM+PM'               where term = 'term4' and name = 'Mergers & Acquisitions';
update public.courses set schedule_text = 'Nov 6, 13, 20, 27 AM+PM'               where term = 'term4' and name = 'Sports Business Management';

update public.courses set schedule_text = 'Jan 7, 8 AM+PM'                        where term = 'term5' and name = 'New Trends in Sustainable and Regenerative Business';
update public.courses set schedule_text = 'Jan 11-14 AM+PM'                       where term = 'term5' and name = 'Managing Digital Banking and Fintech';
update public.courses set schedule_text = 'Jan 11-14 AM+PM'                       where term = 'term5' and name = 'In Search of Principles for a Life Philosophy';
update public.courses set schedule_text = 'Jan 18-21 + Jan 25-28 AM'              where term = 'term5' and name = 'B2B Marketing';
update public.courses set schedule_text = 'Jan 18, 19, 21, 22 PM'                 where term = 'term5' and name = 'Geopolitics';
update public.courses set schedule_text = 'Jan 25-28 AM+PM'                       where term = 'term5' and name = 'Consumer Data Analytics';
update public.courses set schedule_text = 'Jan 29, 30 + Feb 5, 6 PM'              where term = 'term5' and name = 'Understanding Where You Are';
update public.courses set schedule_text = 'Feb 1-5 AM+PM'                         where term = 'term5' and name = 'Behavioral Economics';
update public.courses set schedule_text = 'Feb 1, 2 AM+PM'                        where term = 'term5' and name = 'Advanced Negotiation Tactics';

update public.courses set schedule_text = 'Feb 8, 15, 22 + Mar 1 AM+PM'           where term = 'term5' and name = 'Performance Measurements and Control Systems';
update public.courses set schedule_text = 'Feb 9-12 AM'                           where term = 'term5' and name = 'Innovation with Brain-Pleasing Marketing';
update public.courses set schedule_text = 'Feb 9-12 PM'                           where term = 'term5' and name = 'Learning Stakeholder Management through Theater';
update public.courses set schedule_text = 'Feb 16-19 AM'                          where term = 'term5' and name = 'Strategic Corporate Governance from an International Perspective';
update public.courses set schedule_text = 'Mar 2, 3 AM+PM'                        where term = 'term5' and name = 'Rights for Robots';
-- "Thinking with Data" stays at "TBD" — no dates yet from ESADE.
