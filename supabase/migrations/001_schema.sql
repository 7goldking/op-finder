-- OP FINDER — Полная схема БД для Supabase
-- Запусти в: Supabase Dashboard → SQL Editor → New Query

create extension if not exists "uuid-ossp";

-- ПРОФИЛИ
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text default '', avatar_url text default '',
  bio text default '', city text default '', age integer,
  education_level text, education_place text,
  interests text[] default '{}', skills text[] default '{}',
  goals text default '', account_type text default 'participant',
  organization_id uuid, is_mentor boolean default false,
  onboarded boolean default false, friends uuid[] default '{}',
  search_history text[] default '{}', referral_code text,
  social_links jsonb default '[]', ai_system_prompt text default '',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id,email,full_name,avatar_url)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(new.raw_user_meta_data->>'avatar_url',''))
  on conflict(id) do nothing;
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- ОРГАНИЗАЦИИ
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text default '', city text default '',
  website text default '', logo_url text default '',
  contact_email text, owner_email text, social_links jsonb default '[]',
  verified boolean default false, created_at timestamptz default now()
);

-- СОБЫТИЯ
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null, short_description text default '', description text default '',
  cover_image_url text default '', category text default '',
  format text default 'online', city text default '',
  status text default 'draft', organization_id uuid, organization_name text default '',
  start_date date, end_date date, deadline date,
  tags text[] default '{}', requirements text default '',
  form_fields jsonb default '[]', max_participants integer,
  views_count integer default 0, applications_count integer default 0,
  created_by text, created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ЗАЯВКИ
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_email text, user_name text, user_city text, user_education text,
  status text default 'pending', answers jsonb default '{}', cv_url text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- МЕНТОРЫ
create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  name text not null, headline text default '', bio text default '',
  avatar_url text default '', city text default '',
  expertise text[] default '{}', price_per_hour integer default 0,
  currency text default 'RUB', accepting_requests boolean default true,
  owner_email text, social_links jsonb default '[]', created_at timestamptz default now()
);

-- ОТЗЫВЫ О МЕНТОРАХ
create table if not exists public.mentor_reviews (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.mentors(id) on delete cascade,
  author_email text, author_name text, rating integer, text text default '',
  created_at timestamptz default now()
);

-- ЗАПРОСЫ НА МЕНТОРСТВО
create table if not exists public.mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.mentors(id) on delete cascade,
  student_email text, student_name text, topic text default '',
  message text default '', status text default 'pending',
  created_at timestamptz default now()
);

-- СТАТЬИ
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null, content text default '', cover_url text default '',
  author_email text, author_name text, status text default 'draft',
  tags text[] default '{}', views_count integer default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- КОМАНДЫ
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  name text not null, description text default '', status text default 'open',
  members jsonb default '[]', created_by text, created_at timestamptz default now()
);

-- ПРОЕКТЫ
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text default '', url text default '',
  image_url text default '', tags text[] default '{}',
  created_by text, created_at timestamptz default now()
);

-- ЗАКЛАДКИ
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_email text, created_at timestamptz default now(),
  unique(event_id, user_email)
);

-- ОТЗЫВЫ О СОБЫТИЯХ
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  author_email text, author_name text, rating integer, text text default '',
  helpful_count integer default 0, helpful_by text[] default '{}',
  created_at timestamptz default now()
);

-- ЧАТЫ
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a text not null, participant_b text not null,
  participants text[] default '{}', participant_names jsonb default '{}',
  participant_avatars jsonb default '{}', last_message text default '',
  last_message_at timestamptz, last_sender_email text,
  unread_for text[] default '{}', created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_email text, sender_name text, text text default '',
  created_at timestamptz default now()
);

-- ГРУППОВЫЕ ЧАТЫ
create table if not exists public.group_chats (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text default '',
  created_by text, members text[] default '{}', created_at timestamptz default now()
);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.group_chats(id) on delete cascade,
  sender_email text, sender_name text, text text default '',
  created_at timestamptz default now()
);

-- УВЕДОМЛЕНИЯ
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_email text, title text default '', message text default '',
  type text default 'info', link text default '', read boolean default false,
  created_at timestamptz default now()
);

-- ЛЕНТА
create table if not exists public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  for_email text, type text default '', title text default '',
  description text default '', link text default '',
  created_at timestamptz default now()
);

-- ДРУЗЬЯ
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_email text, to_email text, status text default 'pending',
  created_at timestamptz default now(), unique(from_email, to_email)
);

-- РЕФЕРАЛЫ
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_email text, referred_email text, code text,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.applications enable row level security;
alter table public.mentors enable row level security;
alter table public.mentor_reviews enable row level security;
alter table public.mentorship_requests enable row level security;
alter table public.articles enable row level security;
alter table public.teams enable row level security;
alter table public.projects enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.group_chats enable row level security;
alter table public.group_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_feed enable row level security;
alter table public.friend_requests enable row level security;
alter table public.referrals enable row level security;

-- Profiles policies
create policy "view profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Events policies
create policy "view published events" on public.events for select using (status = 'published' or auth.role() = 'authenticated');
create policy "auth insert events" on public.events for insert with check (auth.role() = 'authenticated');
create policy "auth update events" on public.events for update using (auth.role() = 'authenticated');
create policy "auth delete events" on public.events for delete using (auth.role() = 'authenticated');

-- Mentors public
create policy "mentors public" on public.mentors for select using (true);
create policy "auth insert mentors" on public.mentors for insert with check (auth.role() = 'authenticated');
create policy "auth update mentors" on public.mentors for update using (auth.role() = 'authenticated');
create policy "auth delete mentors" on public.mentors for delete using (auth.role() = 'authenticated');

-- All other tables: authenticated full access
do $$ declare t text;
begin foreach t in array array[
  'organizations','applications','mentor_reviews','mentorship_requests',
  'articles','teams','projects','bookmarks','reviews','conversations',
  'messages','group_chats','group_messages','notifications',
  'activity_feed','friend_requests','referrals'
] loop
  execute format('create policy "auth all %I" on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',t,t);
end loop; end $$;

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.group_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.organizations;
