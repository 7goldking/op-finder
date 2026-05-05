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
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

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

const VALID_CATEGORIES = ['hackathon','olympiad','grant','scholarship','fellowship','internship','summer_school','competition','exchange','mentorship','forum','conference','workshop','accelerator','mun','volunteering','custom'];

// Heuristic title-based category mapping as a safety net when Llama returns 'custom'
// or the user-facing category set evolves faster than the prompt.
function inferCategoryFromTitle(title: string, fallback: string): string {
  const t = (title || '').toLowerCase();
  if (/fellowship|fellow\b/.test(t)) return 'fellowship';
  if (/scholarship|stipend|stipendi/.test(t)) return 'scholarship';
  if (/hackathon|hack-?a-?thon/.test(t)) return 'hackathon';
  if (/olympiad|\u043e\u043b\u0438\u043c\u043f\u0438\u0430\u0434/.test(t)) return 'olympiad';
  if (/internship|\u0441\u0442\u0430\u0436\u0438\u0440\u043e\u0432\u043a/.test(t)) return 'internship';
  if (/grant|\u0433\u0440\u0430\u043d\u0442/.test(t)) return 'grant';
  if (/summer school|\u043b\u0435\u0442\u043d\u044f\u044f \u0448\u043a\u043e\u043b/.test(t)) return 'summer_school';
  if (/mentorship|\u043c\u0435\u043d\u0442\u043e\u0440/.test(t)) return 'mentorship';
  if (/conference|\u043a\u043e\u043d\u0444\u0435\u0440\u0435\u043d\u0446/.test(t)) return 'conference';
  if (/workshop|\u0432\u043e\u0440\u043a\u0448\u043e\u043f/.test(t)) return 'workshop';
  if (/accelerator|incubat|\u0430\u043a\u0441\u0435\u043b\u0435\u0440\u0430\u0442\u043e\u0440/.test(t)) return 'accelerator';
  if (/forum|\u0444\u043e\u0440\u0443\u043c/.test(t)) return 'forum';
  if (/exchange|\u043e\u0431\u043c\u0435\u043d/.test(t)) return 'exchange';
  if (/(model un|mun)\b/.test(t)) return 'mun';
  if (/volunteer|\u0432\u043e\u043b\u043e\u043d\u0442/.test(t)) return 'volunteering';
  if (/competition|contest|\u043a\u043e\u043d\u043a\u0443\u0440\u0441/.test(t)) return 'competition';
  return fallback;
}

// Cheap pre-filter: only keep posts that look like opportunities. Cuts ~80%+ of
// low-signal posts (memes, news, photo dumps) before paying for LLM extraction.
const OPP_KEYWORDS = [
  'грант', 'стипенди', 'стажиров', 'конкурс', 'хакатон',
  'олимпиад', 'форум', 'вакансия', 'подача', 'дедлайн',
  'волонтер', 'обмен', 'феллоушип', 'летняя школ',
  'apply', 'deadline', 'fellowship', 'scholarship', 'internship',
  'hackathon', 'competition', 'grant ', 'grants ', 'mentorship',
  'application form', 'submit your', 'register now', 'open call',
];
function looksLikeOpportunity(text: string): boolean {
  const t = text.toLowerCase();
  let hits = 0;
  for (const k of OPP_KEYWORDS) {
    if (t.includes(k)) {
      hits++;
      if (hits >= 1) return true; // a single hit is enough
    }
  }
  // Strong intent words always pass
  return /(register|apply now|подать заяв|регистраци|deadline)/i.test(text);
}

// Strip tracking params, lowercase host, drop fragment, drop trailing slash.
// Two URLs that differ only by utm/fbclid/ref/gclid resolve to the same canonical.
const TRACKING_PREFIXES = ['utm_', 'fbclid', 'gclid', 'mc_eid', 'mc_cid', 'ref', 'ref_', 'igshid'];
function canonicalUrl(input: string): string {
  try {
    const u = new URL(input);
    const params = [...u.searchParams.entries()].filter(([k]) => {
      const lk = k.toLowerCase();
      return !TRACKING_PREFIXES.some((p) => lk === p || lk.startsWith(p));
    });
    const search = params.length ? '?' + params.map(([k, v]) => `${k}=${v}`).join('&') : '';
    const path = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.protocol.toLowerCase()}//${u.host.toLowerCase()}${path}${search}`;
  } catch {
    return input;
  }
}

async function fetchSource(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru,en;q=0.9,kk;q=0.8',
    },
  });
  if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`);
  const html = await r.text();

  // Telegram /s/ preview pages — extract individual posts with link + datetime so
  // Llama sees structured channel feed, not garbled HTML soup.
  // Pre-filter posts by keyword presence: only opportunity-shaped posts go to LLM.
  if (url.startsWith('https://t.me/s/') || url.startsWith('http://t.me/s/')) {
    const posts: string[] = [];
    const msgRe = /<div class="tgme_widget_message_wrap[\s\S]*?<a class="tgme_widget_message_date"[^>]*href="(https?:\/\/t\.me\/[^\"]+)"[\s\S]*?<time[^>]*datetime="([^"]+)"[\s\S]*?<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div class="tgme_widget_message_footer/g;
    let m: RegExpExecArray | null;
    while ((m = msgRe.exec(html)) !== null) {
      const link = m[1];
      const date = m[2];
      const text = m[3]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<a[^>]*href="([^\"]+)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 80 && looksLikeOpportunity(text)) {
        posts.push(`[POST ${posts.length + 1} · ${date}]\nURL: ${link}\n${text.slice(0, 1200)}`);
      }
      if (posts.length >= 20) break;
    }
    if (posts.length > 0) return posts.join('\n\n').slice(0, 12000);
    // Fall through to generic if no posts matched (channel might be private)
  }

  // RSS / Atom feed handling
  if (html.includes('<rss') || html.includes('<feed')) {
    const items: string[] = [];
    const itemRe = /<(item|entry)>([\s\S]*?)<\/\1>/g;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(html)) !== null && items.length < 20) {
      const inner = m[2];
      const title = (inner.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [, ''])[1]
        .replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').trim();
      const link = (inner.match(/<link[^>]*>([\s\S]*?)<\/link>/) || inner.match(/<link[^>]*href="([^"]+)"/) || [, ''])[1].trim();
      const desc = (inner.match(/<(description|summary|content)[^>]*>([\s\S]*?)<\/\1>/) || [, '', ''])[2]
        .replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').trim();
      const pub = (inner.match(/<(pubDate|updated|published)[^>]*>([\s\S]*?)<\/\1>/) || [, '', ''])[2].trim();
      items.push(`[${title}]\nURL: ${link}\nDate: ${pub}\n${desc.slice(0, 800)}`);
    }
    if (items.length) return items.join('\n\n').slice(0, 12000);
  }

  // Generic HTML — strip scripts/styles + tags
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const text = cleaned
    .replace(/<a[^>]*href="([^\"]+)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)') // preserve link URLs
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 10000);
}

async function extractWithLlama(sourceName: string, sourceUrl: string, html: string): Promise<ExtractedEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const systemPrompt = `Ты строгий ассистент-валидатор, который извлекает РЕАЛЬНЫЕ АКТУАЛЬНЫЕ возможности (хакатоны, гранты, стажировки, олимпиады, летние школы, конкурсы, стипендии) для молодёжной платформы Op Finder в Казахстане.

Сегодня: ${today}

КРИТЕРИИ ОТБОРА (все обязательны):
1. Конкретное будущее событие с датой дедлайна или датой начала >= ${today}. Без точной даты — пропускай.
2. Есть актуальный URL регистрации или страницы события (не главная новостной ленты, не просто категория).
3. Actionable: пользователь может подать заявку / зарегистрироваться / узнать подробности.
4. Категория строго одно из: ${VALID_CATEGORIES.join(', ')}.

ЖЁСТКО ОТФИЛЬТРОВЫВАЙ:
- Новости, пресс-релизы, итоги прошедших событий, фотоотчёты, интервью, статьи, колонки мнений
- Прошедшие события (deadline или start_date в прошлом)
- События с неопределёнными датами ("скоро", "в этом году", "следите за обновлениями")
- Реклама услуг, курсов с постоянным набором, продукты компаний
- Политический контент

ПРАВИЛА ДАННЫХ:
- Все даты в формате YYYY-MM-DD. Если в тексте нет точной даты — поле null/пусто.
- external_url — АБСОЛЮТНАЯ ссылка на страницу события (разворачивай относительные от ${sourceUrl}). Не используй главные страницы сайта.
- confidence (0..1): 
  * 0.9-1.0 — конкретное событие с точной датой, URL, названием и описанием
  * 0.7-0.9 — есть все поля, но формулировки расплывчатые
  * 0.5-0.7 — есть сомнения насчёт актуальности
  * <0.5 — НЕ ВКЛЮЧАЙ В ОТВЕТ
- title: на языке оригинала, без кавычек и восклицательных знаков
- short_description: 1 предложение, 80-180 символов

Отвечай ТОЛЬКО валидным JSON-массивом без markdown. Если ничего не подходит — верни [].
Формат: [{"title":"...", "short_description":"...", "description":"...", "category":"hackathon", "deadline":"2026-05-31", "start_date":"2026-06-15", "end_date":"2026-06-17", "city":"Almaty", "organization_name":"...", "tags":["AI","data"], "external_url":"https://...", "confidence":0.9}]`;

  const userPrompt = `Источник: ${sourceName} (${sourceUrl})

HTML-контент:
${html}

Извлеки до 15 самых актуальных событий. Если событий нет — верни []`;

  // Primary: Cloudflare Workers AI (Llama 3.3 70B, paid tier via existing CF account).
  // Fallback to Groq if CF creds missing or call fails (rate-limit safety).
  const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  const cfToken = Deno.env.get('CLOUDFLARE_AI_TOKEN');
  let content = '';
  let lastErr = '';

  if (cfAccountId && cfToken) {
    const trimmedHtml = html.slice(0, 12000);
    const trimmedUserPrompt = `Источник: ${sourceName} (${sourceUrl})\n\nHTML-контент:\n${trimmedHtml}\n\nИзвлеки до 15 самых актуальных событий. Если событий нет — верни []`;
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: trimmedUserPrompt },
        ],
        temperature: 0.2,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      }),
    });
    if (r.ok) {
      const data = await r.json();
      content = data?.result?.response ?? '';
      if (typeof content !== 'string') content = JSON.stringify(content);
    } else {
      lastErr = `CF Workers AI ${r.status}: ${(await r.text()).slice(0, 300)}`;
    }
  }

  // Fallback: Groq (free or paid tier)
  if (!content) {
    const models = [
      { id: 'llama-3.3-70b-versatile', userPromptCap: 12000 },
      { id: 'llama-3.1-8b-instant', userPromptCap: 4500 },
    ];
    let r: Response | null = null;
    for (const model of models) {
      const trimmedHtml = html.slice(0, model.userPromptCap);
      const trimmedUserPrompt = `Источник: ${sourceName} (${sourceUrl})\n\nHTML-контент:\n${trimmedHtml}\n\nИзвлеки до 15 самых актуальных событий. Если событий нет — верни []`;
      r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model.id,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: trimmedUserPrompt },
          ],
          temperature: 0.2,
          max_tokens: 2500,
          response_format: { type: 'json_object' },
        }),
      });
      if (r.ok) break;
      lastErr = `Groq ${model.id} ${r.status}: ${(await r.text()).slice(0, 300)}`;
      if (r.status !== 429 && r.status !== 413) break;
    }
    if (!r || !r.ok) {
      throw new Error(lastErr || 'No LLM provider available');
    }
    const data = await r.json();
    content = data.choices?.[0]?.message?.content ?? '[]';
  }

  // Llama with json_object mode returns an object, not array. Find the array inside.
  // Strip markdown code fences if present (Llama sometimes wraps JSON in ```json ... ```).
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  // Find first { or [ and last } or ] to handle prose wrapping.
  const firstBrace = cleaned.search(/[\[{]/);
  const lastBrace = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  if (firstBrace > 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
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
      category: (() => {
        const raw = String(e.category || '').toLowerCase().trim();
        if (VALID_CATEGORIES.includes(raw)) {
          // Llama sometimes picks 'custom' even when a clear category exists in the title — override.
          if (raw === 'custom') return inferCategoryFromTitle(e.title, 'custom');
          return raw;
        }
        return inferCategoryFromTitle(e.title, 'custom');
      })(),
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

async function generateEmbedding(text: string): Promise<number[] | null> {
  // CF Workers AI bge-m3: multilingual (RU/EN/KZ), 1024 dims, free in CF Paid plan.
  const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  const cfToken = Deno.env.get('CLOUDFLARE_AI_TOKEN');
  if (!cfAccountId || !cfToken) return null;
  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/baai/bge-m3`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: [text.slice(0, 4000)] }),
      },
    );
    if (!r.ok) return null;
    const data = await r.json();
    const v = data?.result?.data?.[0];
    return Array.isArray(v) && v.length === 1024 ? v : null;
  } catch {
    return null;
  }
}

async function isDuplicate(
  ev: ExtractedEvent,
  canonical: string,
  embedding: number[] | null,
): Promise<boolean> {
  // Layer 1: canonical_url match (fastest, indexed)
  if (canonical) {
    const { data } = await supa
      .from('events')
      .select('id')
      .eq('canonical_url', canonical)
      .limit(1);
    if (data && data.length > 0) return true;
  }
  // Layer 2: legacy external_url (catches pre-canonical rows)
  if (ev.external_url) {
    const { data } = await supa
      .from('events')
      .select('id')
      .eq('external_url', ev.external_url)
      .limit(1);
    if (data && data.length > 0) return true;
  }
  // Layer 3: semantic dedup via pgvector (cosine sim > 0.92, last 90 days)
  if (embedding) {
    const { data } = await supa.rpc('find_semantic_duplicate', {
      p_embedding: embedding,
      p_threshold: 0.92,
      p_days: 90,
    });
    if (data) return true;
  }
  // Layer 4: title similarity (case-insensitive exact)
  const { data: byTitle } = await supa
    .from('events')
    .select('id')
    .ilike('title', ev.title)
    .limit(1);
  return !!(byTitle && byTitle.length > 0);
}

async function processSource(source: { id: string; name: string; url: string }, prefetchedText?: string) {
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
    // Prefetched text path: external worker (e.g. Telethon for Telegram) fetched
    // the raw posts already and is passing them inline. Skip HTTP fetch.
    html = prefetchedText && prefetchedText.length > 0
      ? prefetchedText.slice(0, 12000)
      : await fetchSource(source.url);
    events = await extractWithLlama(source.name, source.url, html);
    const todayStr = new Date().toISOString().slice(0, 10);
    for (const ev of events) {
      // Quality gate: confidence >= 0.4 (relaxed for higher recall on KZ sources)
      if (ev.confidence < 0.4) { skipped++; continue; }
      // Reject past events when date present
      if (ev.deadline && ev.deadline < todayStr) { skipped++; continue; }
      if (!ev.deadline && ev.start_date && ev.start_date < todayStr) { skipped++; continue; }
      // Default deadline: 60 days out if neither date present (gives time to apply / explore)
      if (!ev.deadline && !ev.start_date) {
        const d = new Date();
        d.setDate(d.getDate() + 60);
        ev.deadline = d.toISOString().slice(0, 10);
      }
      // Must have a registration URL — accept any valid URL (even bare landing page is better than nothing)
      if (!ev.external_url) { skipped++; continue; }
      try {
        new URL(ev.external_url);
      } catch { skipped++; continue; }
      // Title quality
      if (!ev.title || ev.title.length < 8) { skipped++; continue; }
      const canonical = canonicalUrl(ev.external_url);
      const embedText = `${ev.title}\n\n${ev.short_description || ''}\n\n${(ev.description || '').slice(0, 1500)}`;
      const embedding = await generateEmbedding(embedText);
      if (await isDuplicate(ev, canonical, embedding)) { skipped++; continue; }
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
        canonical_url: canonical,
        embedding: embedding as any,
        discovery_source: 'ai-agent',
        ai_confidence: ev.confidence,
        ai_raw_data: ev as any,
        created_by: 'ai-agent@op-finder.online',
      });
      if (!error) inserted++;
    }
    // Update source stats + per-source schedule
    const scheduleMin = (source as any).schedule_min ?? 360;
    const nextRun = new Date(Date.now() + scheduleMin * 60_000).toISOString();
    await supa
      .from('discovery_sources')
      .update({
        last_scanned_at: new Date().toISOString(),
        events_found_total: events.length,
        next_run_at: nextRun,
        consecutive_fails: 0,
      })
      .eq('id', source.id);
  } catch (e: any) {
    errMsg = e.message?.slice(0, 1000) ?? String(e);
    // back off failing source: schedule next run further out
    const fails = ((source as any).consecutive_fails ?? 0) + 1;
    const backoffMin = Math.min(60 * 24, 30 * Math.pow(2, fails - 1)); // 30, 60, 120, 240, ... cap 24h
    const nextRun = new Date(Date.now() + backoffMin * 60_000).toISOString();
    await supa
      .from('discovery_sources')
      .update({
        last_scanned_at: new Date().toISOString(),
        next_run_at: nextRun,
        consecutive_fails: fails,
        // auto-disable after 8 consecutive fails to stop wasting cycles
        enabled: fails >= 8 ? false : (source as any).enabled ?? true,
      })
      .eq('id', source.id);
  }

  // Update source_health snapshot
  await supa.from('source_health').upsert({
    source_id: source.id,
    last_run_at: new Date().toISOString(),
    last_success_at: errMsg ? null : new Date().toISOString(),
    last_error: errMsg,
    consecutive_fails: errMsg ? ((source as any).consecutive_fails ?? 0) + 1 : 0,
    items_24h: events.length,
    inserted_24h: inserted,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'source_id' });

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
    const prefetchedText: string | undefined = body.prefetched_text;

    // Honour next_run_at unless caller explicitly requests a run-now or specific source.
    const runAll: boolean = body.run_all === true;
    let q = supa.from('discovery_sources')
      .select('id,name,url,schedule_min,consecutive_fails,enabled')
      .eq('enabled', true);
    if (sourceIdFilter) {
      q = q.eq('id', sourceIdFilter);
    } else if (!runAll) {
      // Only sources due now (next_run_at null or in the past)
      q = q.or('next_run_at.is.null,next_run_at.lte.' + new Date().toISOString());
      q = q.limit(20);
    }
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
      // Only the explicitly-requested single source can use prefetched_text
      const useText = prefetchedText && sourceIdFilter && s.id === sourceIdFilter
        ? prefetchedText
        : undefined;
      const r = await processSource(s as any, useText);
      results.push(r);
      if (i < sources.length - 1) {
        await new Promise((res) => setTimeout(res, 5000));
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
