-- AI Event Discovery — фоновый агент находит события и публикует в каталог
-- Применить: Supabase Dashboard → SQL Editor → запустить весь файл

-- 1. Добавить поля в events для трекинга AI-discovery
alter table public.events
  add column if not exists external_url text default '',
  add column if not exists discovery_source text default '',  -- 'ai-agent', 'manual', 'org-uploaded'
  add column if not exists ai_confidence numeric(3,2),         -- 0.00–1.00
  add column if not exists ai_raw_data jsonb;                  -- сырой JSON от LLM для отладки

-- 2. Таблица источников для скрапинга
create table if not exists public.discovery_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  source_type text default 'html',          -- 'html', 'rss', 'telegram', 'json-api'
  enabled boolean default true,
  last_scanned_at timestamptz,
  events_found_total integer default 0,
  notes text default '',
  created_at timestamptz default now()
);

-- 3. Таблица логов запусков (для дашборда и отладки)
create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.discovery_sources(id) on delete cascade,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text default 'running',            -- 'running', 'success', 'error', 'partial'
  events_extracted integer default 0,
  events_inserted integer default 0,
  events_skipped_duplicates integer default 0,
  error_message text,
  raw_response_preview text                  -- первые 2KB ответа LLM для отладки
);

-- 4. Засеять стартовый набор источников
insert into public.discovery_sources (name, url, source_type, notes) values
  ('Astana Hub Events', 'https://astanahub.com/ru/events', 'html', 'Хакатоны, акселераторы, демо-дни'),
  ('Bolashak', 'https://bolashak.gov.kz/ru/programmy', 'html', 'Госстипендии РК'),
  ('OpportunityDesk', 'https://opportunitydesk.org/category/all-opportunities/', 'html', 'Международные программы'),
  ('Erasmus+ Kazakhstan', 'https://erasmusplus.kz/news/', 'html', 'Европейские стипендии и обмены'),
  ('British Council KZ', 'https://www.britishcouncil.kz/en/programmes', 'html', 'Chevening, Newton-Al-Farabi'),
  ('DAAD Kazakhstan', 'https://www.daad.kz/ru/stipendien-und-foerderung/', 'html', 'Немецкие стипендии'),
  ('Decentrathon', 'https://decentrathon.kz/', 'html', 'Главный хакатон KZ'),
  ('NU News', 'https://nu.edu.kz/news', 'html', 'Назарбаев Универ — события и гранты'),
  ('AIESEC KZ', 'https://aiesec.kz/', 'html', 'Global Volunteer и Talent программы'),
  ('Kursiv Edu Telegram', 'https://t.me/s/kursiv_kz', 'html', 'Лента Kursiv с возможностями для молодёжи')
on conflict do nothing;

-- 5. Индексы для быстрого фильтра по AI-найденным событиям
create index if not exists idx_events_discovery_source on public.events(discovery_source) where discovery_source is not null;
create index if not exists idx_events_external_url on public.events(external_url) where external_url <> '';

-- 6. RLS — публичное чтение источников и логов; запись только service_role
alter table public.discovery_sources enable row level security;
alter table public.discovery_runs enable row level security;

drop policy if exists "discovery_sources_read_all" on public.discovery_sources;
create policy "discovery_sources_read_all" on public.discovery_sources for select using (true);

drop policy if exists "discovery_runs_read_all" on public.discovery_runs;
create policy "discovery_runs_read_all" on public.discovery_runs for select using (true);

-- 7. View для админки: последние AI-найденные события
create or replace view public.ai_discovered_events as
select
  e.id, e.title, e.short_description, e.category, e.deadline,
  e.external_url, e.ai_confidence, e.created_at, e.organization_name,
  e.discovery_source
from public.events e
where e.discovery_source = 'ai-agent'
order by e.created_at desc;
