-- Extra columns used by frontend that weren't in the original schema

alter table public.events
  add column if not exists language text default 'ru',
  add column if not exists level text[] default '{}',
  add column if not exists category_custom text default '',
  add column if not exists result_date date,
  add column if not exists min_age integer,
  add column if not exists max_age integer;
