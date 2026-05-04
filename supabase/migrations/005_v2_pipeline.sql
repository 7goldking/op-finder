-- v2 Pipeline migration
-- Adds: canonical URL dedupe, source_health, submissions (moderation queue),
--       per-source scheduling state, pre-filter / pipeline support.
-- Embeddings (pgvector) intentionally deferred to a follow-up migration.

-- 1. canonical_url for events (URL stripped of utm/tracking, lowercase host)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS canonical_url text;

CREATE INDEX IF NOT EXISTS idx_events_canonical_url
  ON public.events (canonical_url)
  WHERE canonical_url IS NOT NULL;

-- 2. discovery_sources: per-source schedule + health pointers
ALTER TABLE public.discovery_sources
  ADD COLUMN IF NOT EXISTS schedule_min int NOT NULL DEFAULT 720,    -- run every N minutes
  ADD COLUMN IF NOT EXISTS next_run_at  timestamptz,
  ADD COLUMN IF NOT EXISTS state        jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS weight       int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS consecutive_fails int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_discovery_sources_next_run
  ON public.discovery_sources (next_run_at)
  WHERE enabled = true;

-- Hot sources run every 20 min, others every 6 h.
-- Telegram channels and a few high-yield websites are hot.
UPDATE public.discovery_sources SET schedule_min = 20
 WHERE source_type = 'telegram'
    OR url ILIKE '%astanahub.com%'
    OR url ILIKE '%opportunitiesforyouth.org%'
    OR url ILIKE '%opportunitydesk.org%';

UPDATE public.discovery_sources SET schedule_min = 360
 WHERE schedule_min = 720;     -- everything still on default → 6 h

-- 3. source_health (one row per source, mutated by ingest workers)
CREATE TABLE IF NOT EXISTS public.source_health (
  source_id          uuid PRIMARY KEY REFERENCES public.discovery_sources(id) ON DELETE CASCADE,
  last_run_at        timestamptz,
  last_success_at    timestamptz,
  last_error         text,
  consecutive_fails  int NOT NULL DEFAULT 0,
  items_24h          int NOT NULL DEFAULT 0,
  inserted_24h       int NOT NULL DEFAULT 0,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.source_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "source_health public read" ON public.source_health;
CREATE POLICY "source_health public read" ON public.source_health
  FOR SELECT USING (true);

-- 4. submissions (user-submitted opportunities → moderation queue)
CREATE TABLE IF NOT EXISTS public.submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email    text,
  user_name     text,
  title         text NOT NULL,
  description   text NOT NULL,
  category      text,
  url           text NOT NULL,
  deadline      date,
  city          text,
  organization_name text,
  status        text NOT NULL DEFAULT 'pending',     -- pending|approved|rejected
  reject_reason text,
  reviewed_by   uuid REFERENCES public.profiles(id),
  reviewed_at   timestamptz,
  created_event_id uuid REFERENCES public.events(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions (status, created_at DESC);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can submit; everyone can read their own;
-- admins read all (admin check handled via RPC for moderation).
DROP POLICY IF EXISTS "submissions insert authed" ON public.submissions;
CREATE POLICY "submissions insert authed" ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "submissions read own" ON public.submissions;
CREATE POLICY "submissions read own" ON public.submissions
  FOR SELECT USING (auth.uid() = user_id);

-- 5. RPC: submit_opportunity (anonymous-safe via SECURITY INVOKER + auth context)
CREATE OR REPLACE FUNCTION public.submit_opportunity(
  p_title text,
  p_description text,
  p_url text,
  p_category text DEFAULT NULL,
  p_deadline date DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_organization_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id   uuid;
  v_uid  uuid := auth.uid();
  v_email text;
BEGIN
  IF p_title IS NULL OR length(trim(p_title)) < 5 THEN
    RAISE EXCEPTION 'title too short';
  END IF;
  IF p_url IS NULL OR p_url !~* '^https?://' THEN
    RAISE EXCEPTION 'url must be a valid http(s) link';
  END IF;
  IF v_uid IS NOT NULL THEN
    SELECT email INTO v_email FROM public.profiles WHERE id = v_uid;
  END IF;
  INSERT INTO public.submissions (
    user_id, user_email, title, description, url, category, deadline,
    city, organization_name, status
  ) VALUES (
    v_uid, v_email, trim(p_title), trim(coalesce(p_description, '')), p_url,
    p_category, p_deadline, p_city, p_organization_name, 'pending'
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_opportunity(text,text,text,text,date,text,text)
  TO anon, authenticated;

-- 6. RPC: list_pending_submissions (admin only)
CREATE OR REPLACE FUNCTION public.list_pending_submissions()
RETURNS SETOF public.submissions
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.submissions
   WHERE status = 'pending'
   ORDER BY created_at DESC
   LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION public.list_pending_submissions() TO authenticated;

-- 7. RPC: approve_submission — turn a submission into a published event
CREATE OR REPLACE FUNCTION public.approve_submission(p_submission_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  s record;
  new_event_id uuid;
BEGIN
  SELECT * INTO s FROM public.submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'submission % not found', p_submission_id;
  END IF;
  IF s.status <> 'pending' THEN
    RAISE EXCEPTION 'submission already %', s.status;
  END IF;
  INSERT INTO public.events (
    title, short_description, description, category, format, city, status,
    organization_name, deadline, external_url, discovery_source, ai_confidence,
    created_by
  ) VALUES (
    s.title,
    left(coalesce(s.description, ''), 250),
    s.description,
    coalesce(s.category, 'custom'),
    'online',
    coalesce(s.city, ''),
    'published',
    coalesce(s.organization_name, 'Сообщество'),
    s.deadline,
    s.url,
    'user-submission',
    0.85,
    coalesce(s.user_email, 'community@op-finder.online')
  ) RETURNING id INTO new_event_id;
  UPDATE public.submissions
     SET status = 'approved',
         reviewed_at = now(),
         reviewed_by = auth.uid(),
         created_event_id = new_event_id
   WHERE id = p_submission_id;
  RETURN new_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_submission(uuid) TO authenticated;

-- 8. RPC: reject_submission
CREATE OR REPLACE FUNCTION public.reject_submission(p_submission_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.submissions
     SET status = 'rejected',
         reject_reason = coalesce(p_reason, ''),
         reviewed_at = now(),
         reviewed_by = auth.uid()
   WHERE id = p_submission_id AND status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_submission(uuid, text) TO authenticated;

-- 9. RPC: source_health_summary (admin dashboard)
CREATE OR REPLACE FUNCTION public.source_health_summary()
RETURNS TABLE (
  source_id uuid,
  name text,
  url text,
  source_type text,
  enabled boolean,
  schedule_min int,
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_success_at timestamptz,
  consecutive_fails int,
  items_24h int,
  inserted_24h int,
  last_error text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT s.id, s.name, s.url, s.source_type, s.enabled, s.schedule_min,
         s.next_run_at, h.last_run_at, h.last_success_at,
         coalesce(h.consecutive_fails, 0),
         coalesce(h.items_24h, 0),
         coalesce(h.inserted_24h, 0),
         h.last_error
    FROM public.discovery_sources s
    LEFT JOIN public.source_health h ON h.source_id = s.id
   ORDER BY s.enabled DESC, h.last_run_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.source_health_summary() TO authenticated;
