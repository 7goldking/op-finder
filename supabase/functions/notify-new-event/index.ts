// Notify subscribers (Telegram + email-on-demand) about a newly-published event.
// Called from the client right after creating a new event:
//   POST { event_id }
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SITE_URL = Deno.env.get('SITE_URL') || 'https://op-finder-1777440052.netlify.app';

function escapeMd(s: string): string {
  return s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

async function tg(method: string, body: Record<string, unknown>) {
  if (!BOT_TOKEN) return null;
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { event_id } = await req.json();
    if (!event_id) {
      return new Response(JSON.stringify({ error: 'event_id required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: e, error: eErr } = await supa
      .from('events')
      .select('id,title,short_description,category,city,organization_name,deadline')
      .eq('id', event_id)
      .single();
    if (eErr || !e) {
      return new Response(JSON.stringify({ error: 'event not found' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Find subscribed telegram users matching this category
    let q = supa
      .from('profiles')
      .select('id,telegram_chat_id,interests')
      .eq('telegram_subscribed', true)
      .not('telegram_chat_id', 'is', null);
    const { data: subs } = await q;
    const targets = (subs || []).filter((p: any) =>
      !e.category || !p.interests || p.interests.length === 0 || p.interests.includes(e.category),
    );

    const url = `${SITE_URL}/event/${e.id}`;
    const meta = [e.organization_name, e.city].filter(Boolean).join(' \u00b7 ');
    const text = [
      '\ud83c\udd95 *\u041d\u043e\u0432\u043e\u0435 \u0441\u043e\u0431\u044b\u0442\u0438\u0435*',
      '',
      `*${escapeMd(e.title)}*`,
      meta ? escapeMd(meta) : '',
      '',
      e.short_description ? escapeMd(e.short_description.slice(0, 280)) : '',
      '',
      `[\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043d\u0430 Op Finder](${url})`,
    ].filter(Boolean).join('\n');

    let sent = 0;
    for (const t of targets) {
      const r = await tg('sendMessage', {
        chat_id: t.telegram_chat_id,
        text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: false,
      });
      if (r && (r as any).ok) sent++;
    }

    return new Response(JSON.stringify({ ok: true, sent, candidates: targets.length }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
