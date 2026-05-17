-- Co27 graduates 2027-03-20; Term 5 (Jan-Mar 2027) is part of the elective catalog.
-- ALTER TYPE ... ADD VALUE has to land in its own statement before it can be referenced
-- by INSERTs in the next migration, so this is split from 0007_full_catalog.sql.

alter type term_t add value if not exists 'term5';
