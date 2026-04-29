-- Op Finder — Platform features migration
-- Adds: org slug, verification denorm to events, digest/telegram subscriptions

-- 1) Organization slug (for /org/:slug brand pages and embeds)
alter table public.organizations
  add column if not exists slug text;

create unique index if not exists organizations_slug_key on public.organizations(slug)
  where slug is not null;

-- Generate slugs for existing rows (lowercase ascii of name + short id)
create or replace function public.gen_org_slug(name text, id uuid)
returns text language plpgsql immutable as $$
declare
  base text;
  short text;
begin
  base := lower(regexp_replace(coalesce(name,'org'), '[^a-zA-Z0-9]+', '-', 'g'));
  base := trim(both '-' from base);
  if base = '' then base := 'org'; end if;
  short := substring(replace(id::text, '-', '') from 1 for 6);
  return base || '-' || short;
end;
$$;

update public.organizations
  set slug = public.gen_org_slug(name, id)
  where slug is null;

-- Trigger to autogenerate slug for new orgs
create or replace function public.set_org_slug() returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.gen_org_slug(new.name, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_set_slug on public.organizations;
create trigger organizations_set_slug
  before insert on public.organizations
  for each row execute procedure public.set_org_slug();

-- 2) Denormalize verification onto events for cheap rendering
alter table public.events
  add column if not exists organization_verified boolean default false;

update public.events e
  set organization_verified = coalesce(o.verified, false)
  from public.organizations o
  where e.organization_id = o.id;

-- Trigger: when org.verified flips, sync to all its events
create or replace function public.sync_org_verified_to_events() returns trigger language plpgsql as $$
begin
  if new.verified is distinct from old.verified then
    update public.events
       set organization_verified = new.verified
     where organization_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_sync_verified on public.organizations;
create trigger organizations_sync_verified
  after update on public.organizations
  for each row execute procedure public.sync_org_verified_to_events();

-- Trigger: when event is inserted, copy current verified value
create or replace function public.copy_org_verified_on_event() returns trigger language plpgsql as $$
begin
  if new.organization_id is not null then
    select verified into new.organization_verified
      from public.organizations
     where id = new.organization_id;
    new.organization_verified := coalesce(new.organization_verified, false);
  end if;
  return new;
end;
$$;

drop trigger if exists events_copy_verified on public.events;
create trigger events_copy_verified
  before insert on public.events
  for each row execute procedure public.copy_org_verified_on_event();

-- 3) Subscriptions for email digest + telegram
alter table public.profiles
  add column if not exists digest_subscribed boolean default true,
  add column if not exists telegram_chat_id text,
  add column if not exists telegram_subscribed boolean default false;

-- 4) Track sent digests (so we don't spam)
create table if not exists public.digest_log (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  events_count integer default 0,
  sent_at timestamptz default now()
);
create index if not exists digest_log_user_email_idx on public.digest_log(user_email);
create index if not exists digest_log_sent_at_idx on public.digest_log(sent_at);
