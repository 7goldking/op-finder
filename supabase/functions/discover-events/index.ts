// AI Event Discovery — фоновый агент, который находит события из публичных источников
// Триггерится: вручную (/admin) или через pg_cron (см. конец файла migrations/003)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ExtractedEvent {
  title: string;
  short_description: string;
  description: string;
  category: string; // hackathon|olympiad|grant|internship|summer_school|competition|exchange|mentorship|forum|mun|volunteering|custom
  deadline?: string; // ISO date
  start_date?: string;
  end_date?: string;
  city?: string;
  organization_name?: string;
  tags?: string[];
  external_url?: string;
  confidence: number; // 0..1
}

const VALID_CATEGORIES = ['hackathon','olympiad','grant','internship','summer_school','competition','exchange','mentorship','forum','mun','volunteering','custom'];

async function fetchSource(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; OpFinderBot/1.0; +https://op-finder.online)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
      'Accept-Language': 'ru,en;q=0.9,kk;q=0.8',
    },
  });
  if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`);
  const html = await r.text();
  // Strip scripts/styles to keep tokens down
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  // Strip HTML tags entirely — we only need text. Then cap at 12K chars (~3K tokens).
  const text = cleaned
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 8000);
}

async function extractWithLlama(sourceName: string, sourceUrl: string, html: string): Promise<ExtractedEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const systemPrompt = `Ты ассистент, который извлекает события (хакатоны, гранты, стажировки, олимпиады, летние школы, конкурсы) для молодёжной платформы возможностей в Казахстане.

Правила:
1. Извлекай ТОЛЬКО реальные события с конкретными датами или дедлайнами.
2. Сегодняшняя дата: ${today}. Игнорируй события, чей дедлайн уже прошёл.
3. Категория обязательно одно из: ${VALID_CATEGORIES.join(', ')}.
4. Если поле неизвестно — оставь пустым или null, не выдумывай.
5. external_url — абсолютная ссылка на страницу события (если относительная — раскрой относительно ${sourceUrl}).
6. confidence (0..1) — насколько ты уверен что это реальное актуальное событие.
7. Пропускай рекламу, политику, новости общего характера, прошедшие события.

Отвечай ТОЛЬКО валидным JSON-массивом без markdown:
[{"title":"...", "short_description":"...", "description":"...", "category":"hackathon", "deadline":"2026-05-31", "start_date":"...", "end_date":"...", "city":"Almaty", "organization_name":"...", "tags":["AI","data"], "external_url":"https://...", "confidence":0.9}]`;

  const userPrompt = `Источник: ${sourceName} (${sourceUrl})

HTML-контент:
${html}

Извлеки до 10 самых актуальных событий. Если событий нет — верни []`;

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Groq ${r.status}: ${errText.slice(0, 500)}`);
  }

  const data = await r.json();
  const content: string = data.choices?.[0]?.message?.content ?? '[]';

  // Llama with json_object mode returns an object, not array. Find the array inside.
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }
  // Look for an array key like "events" or use the value if root is array
  let arr: any[] = [];
  if (Array.isArray(parsed)) arr = parsed;
  else if (Array.isArray(parsed.events)) arr = parsed.events;
  else {
    // First array-valued field
    for (const k of Object.keys(parsed)) {
      if (Array.isArray(parsed[k])) { arr = parsed[k]; break; }
    }
  }

  // Validate + normalize
  return arr
    .filter((e) => e && typeof e.title === 'string' && e.title.trim().length > 3)
    .map((e) => ({
      title: String(e.title).trim().slice(0, 250),
      short_description: String(e.short_description ?? '').slice(0, 500),
      description: String(e.description ?? e.short_description ?? '').slice(0, 5000),
      category: VALID_CATEGORIES.includes(e.category) ? e.category : 'custom',
      deadline: validDate(e.deadline),
      start_date: validDate(e.start_date),
      end_date: validDate(e.end_date),
      city: String(e.city ?? '').slice(0, 100),
      organization_name: String(e.organization_name ?? sourceName).slice(0, 200),
      tags: Array.isArray(e.tags) ? e.tags.slice(0, 8).map((t: any) => String(t).slice(0, 40)) : [],
      external_url: validUrl(e.external_url, sourceUrl),
      confidence: typeof e.confidence === 'number' ? Math.max(0, Math.min(1, e.confidence)) : 0.5,
    }));
}

function validDate(d: any): string | undefined {
  if (!d || typeof d !== 'string') return undefined;
  const m = d.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : undefined;
}

function validUrl(u: any, base: string): string {
  if (!u || typeof u !== 'string') return base;
  try {
    return new URL(u, base).toString();
  } catch {
    return base;
  }
}

async function isDuplicate(ev: ExtractedEvent): Promise<boolean> {
  // Check by external_url first (fastest)
  if (ev.external_url) {
    const { data } = await supa
      .from('events')
      .select('id')
      .eq('external_url', ev.external_url)
      .limit(1);
    if (data && data.length > 0) return true;
  }
  // Then by title similarity (case-insensitive exact)
  const { data: byTitle } = await supa
    .from('events')
    .select('id')
    .ilike('title', ev.title)
    .limit(1);
  return !!(byTitle && byTitle.length > 0);
}

async function processSource(source: { id: string; name: string; url: string }) {
  const runStart = await supa
    .from('discovery_runs')
    .insert({ source_id: source.id, status: 'running' })
    .select('id')
    .single();
  const runId = runStart.data?.id;

  let events: ExtractedEvent[] = [];
  let html = '';
  let errMsg: string | null = null;
  let inserted = 0;
  let skipped = 0;

  try {
    html = await fetchSource(source.url);
    events = await extractWithLlama(source.name, source.url, html);
    for (const ev of events) {
      if (ev.confidence < 0.4) { skipped++; continue; }
      if (await isDuplicate(ev)) { skipped++; continue; }
      const { error } = await supa.from('events').insert({
        title: ev.title,
        short_description: ev.short_description,
        description: ev.description,
        category: ev.category,
        format: 'online',
        city: ev.city || '',
        status: 'published',
        organization_name: ev.organization_name || source.name,
        organization_verified: false,
        start_date: ev.start_date,
        end_date: ev.end_date,
        deadline: ev.deadline,
        tags: ev.tags,
        external_url: ev.external_url,
        discovery_source: 'ai-agent',
        ai_confidence: ev.confidence,
        ai_raw_data: ev as any,
        created_by: 'ai-agent@op-finder.online',
      });
      if (!error) inserted++;
    }
    // Update source stats
    await supa
      .from('discovery_sources')
      .update({ last_scanned_at: new Date().toISOString(), events_found_total: events.length })
      .eq('id', source.id);
  } catch (e: any) {
    errMsg = e.message?.slice(0, 1000) ?? String(e);
  }

  if (runId) {
    await supa
      .from('discovery_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: errMsg ? 'error' : 'success',
        events_extracted: events.length,
        events_inserted: inserted,
        events_skipped_duplicates: skipped,
        error_message: errMsg,
        raw_response_preview: html.slice(0, 2048),
      })
      .eq('id', runId);
  }

  return { source: source.name, extracted: events.length, inserted, skipped, error: errMsg };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const sourceIdFilter: string | undefined = body.source_id;

    let q = supa.from('discovery_sources').select('id,name,url').eq('enabled', true);
    if (sourceIdFilter) q = q.eq('id', sourceIdFilter);
    const { data: sources, error } = await q;

    if (error) throw error;
    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'no sources' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Process sources sequentially with delay (stay under Groq TPM limit)
    const results = [];
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      const r = await processSource(s as any);
      results.push(r);
      if (i < sources.length - 1) {
        await new Promise((res) => setTimeout(res, 20000));
      }
    }

    const totalInserted = results.reduce((a, b) => a + b.inserted, 0);
    return new Response(JSON.stringify({ ok: true, total_inserted: totalInserted, results }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
