-- ESADE MBA students use @alumni.esade.edu (not @esade.edu).
-- Widen the CHECK constraint to accept both.

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.users'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%@esade.edu%';
  if cname is not null then
    execute format('alter table public.users drop constraint %I', cname);
  end if;
end$$;

alter table public.users
  add constraint users_email_domain_check
  check (
    lower(email) like '%@esade.edu' or
    lower(email) like '%@alumni.esade.edu'
  );
