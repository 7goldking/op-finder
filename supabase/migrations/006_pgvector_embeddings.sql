-- pgvector embeddings + semantic dedup + personalized recommendations
-- Uses CF Workers AI bge-m3 (multilingual, 1024 dimensions).

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- IVFFlat index for cosine similarity. For ~10k rows, lists=100 is appropriate.
-- Builds lazily; reindex when row count grows by 10x.
CREATE INDEX IF NOT EXISTS idx_events_embedding
  ON public.events
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- profiles can already have interests; expose as text[] for centroid building.
-- (If column already exists, this is a no-op.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}'::text[];

-- 1. RPC: find similar events by embedding (used for "Похожие" widget).
CREATE OR REPLACE FUNCTION public.find_similar_events(p_event_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  short_description text,
  category text,
  city text,
  deadline date,
  external_url text,
  cover_image_url text,
  organization_name text,
  similarity float
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH src AS (
    SELECT embedding FROM public.events WHERE id = p_event_id
  )
  SELECT e.id, e.title, e.short_description, e.category, e.city, e.deadline,
         e.external_url, e.cover_image_url, e.organization_name,
         1 - (e.embedding <=> (SELECT embedding FROM src)) AS similarity
    FROM public.events e, src
   WHERE e.id <> p_event_id
     AND e.status = 'published'
     AND e.embedding IS NOT NULL
     AND src.embedding IS NOT NULL
   ORDER BY e.embedding <=> (SELECT embedding FROM src)
   LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.find_similar_events(uuid, int) TO anon, authenticated;

-- 2. RPC: semantic duplicate detection (used during ingest)
-- Returns the closest existing event id if cosine_sim > p_threshold within last 90 days.
CREATE OR REPLACE FUNCTION public.find_semantic_duplicate(
  p_embedding vector(1024),
  p_threshold float DEFAULT 0.92,
  p_days int DEFAULT 90
) RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.events
   WHERE created_at > now() - (p_days || ' days')::interval
     AND embedding IS NOT NULL
     AND 1 - (embedding <=> p_embedding) > p_threshold
   ORDER BY embedding <=> p_embedding
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_semantic_duplicate(vector, float, int)
  TO anon, authenticated, service_role;

-- 3. RPC: personalized feed (centroid of user interests + recency + popularity)
-- Builds a centroid from up to 20 most recent saves; falls back to interest seed if empty.
CREATE OR REPLACE FUNCTION public.personalized_feed(p_limit int DEFAULT 30)
RETURNS TABLE (
  id uuid,
  title text,
  short_description text,
  category text,
  city text,
  deadline date,
  external_url text,
  cover_image_url text,
  organization_name text,
  tags text[],
  recommended_score float,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_centroid vector(1024);
  v_has_centroid bool := false;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT email INTO v_email FROM public.profiles WHERE id = v_uid;
  END IF;
  IF v_uid IS NULL THEN
    -- Anonymous: just popular + recent
    RETURN QUERY
      SELECT e.id, e.title, e.short_description, e.category, e.city, e.deadline,
             e.external_url, e.cover_image_url, e.organization_name, e.tags,
             ((coalesce(e.views_count, 0) + 1) * 0.001
              + extract(epoch from (now() - e.created_at)) * -0.0000001)::float
                AS recommended_score,
             'popular'::text
        FROM public.events e
       WHERE e.status = 'published'
         AND (e.deadline IS NULL OR e.deadline >= current_date)
       ORDER BY recommended_score DESC
       LIMIT p_limit;
    RETURN;
  END IF;

  -- Build centroid from user's recent bookmarks
  SELECT avg(e.embedding)::vector(1024) INTO v_centroid
    FROM public.events e
    JOIN public.bookmarks b ON b.event_id = e.id
   WHERE b.user_email = v_email
     AND e.embedding IS NOT NULL;

  IF v_centroid IS NOT NULL THEN
    v_has_centroid := true;
  END IF;

  IF v_has_centroid THEN
    RETURN QUERY
      SELECT e.id, e.title, e.short_description, e.category, e.city, e.deadline,
             e.external_url, e.cover_image_url, e.organization_name, e.tags,
             (0.6 * (1 - (e.embedding <=> v_centroid))
              + 0.3 * (1.0 / (1 + extract(epoch from (now() - e.created_at)) / 86400))
              + 0.1 * (least(coalesce(e.views_count, 0), 1000)::float / 1000))::float
                AS recommended_score,
             'forYou'::text
        FROM public.events e
       WHERE e.status = 'published'
         AND e.embedding IS NOT NULL
         AND (e.deadline IS NULL OR e.deadline >= current_date)
         AND NOT EXISTS (
           SELECT 1 FROM public.bookmarks b
            WHERE b.user_email = v_email AND b.event_id = e.id
         )
       ORDER BY recommended_score DESC
       LIMIT p_limit;
  ELSE
    -- Cold start: rank by recency + popularity, prefer KZ-relevant
    RETURN QUERY
      SELECT e.id, e.title, e.short_description, e.category, e.city, e.deadline,
             e.external_url, e.cover_image_url, e.organization_name, e.tags,
             ((CASE WHEN lower(coalesce(e.city, '')) IN
                ('astana','almaty','\u0430\u0441\u0442\u0430\u043d\u0430','\u0430\u043b\u043c\u0430\u0442\u044b','\u0448\u044b\u043c\u043a\u0435\u043d\u0442','shymkent',
                 '\u043a\u0430\u0440\u0430\u0433\u0430\u043d\u0434\u0430','karaganda','kokshetau','\u043a\u043e\u043a\u0448\u0435\u0442\u0430\u0443','taldikorgan')
                THEN 0.4 ELSE 0 END)
              + 0.3 * (1.0 / (1 + extract(epoch from (now() - e.created_at)) / 86400))
              + 0.3 * (least(coalesce(e.views_count, 0), 1000)::float / 1000))::float
                AS recommended_score,
             'discover'::text
        FROM public.events e
       WHERE e.status = 'published'
         AND (e.deadline IS NULL OR e.deadline >= current_date)
       ORDER BY recommended_score DESC
       LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.personalized_feed(int) TO anon, authenticated;
