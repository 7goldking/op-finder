// Weekly digest Edge Function — sends each subscribed user a Friday digest of
// new events matching their interests via Resend.
//
// Trigger:
//   - HTTP POST (admin-only via service_role, or pg_cron via supabase functions invoke)
//   - Optional payload: { dry_run?: boolean, limit?: number }
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM = Deno.env.get('DIGEST_FROM') || 'Op Finder <noreply@kazyouthdiplomacy.com>';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://op-finder-1777440052.netlify.app';

interface Event {
  id: string;
  title: string;
  short_description: string | null;
  category: string | null;
  city: string | null;
  format: string | null;
  cover_image_url: string | null;
  deadline: string | null;
  organization_name: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  interests: string[] | null;
  city: string | null;
  digest_subscribed: boolean | null;
}

function rankEventForUser(e: Event, p: Profile): number {
  let score = 0;
  if (p.interests && e.category && p.interests.includes(e.category)) score += 5;
  if (p.city && e.city && p.city.toLowerCase() === e.city.toLowerCase()) score += 2;
  // small bonus for closer deadlines
  if (e.deadline) {
    const days = (new Date(e.deadline).getTime() - Date.now()) / 86400_000;
    if (days >= 0 && days <= 30) score += 1;
  }
  return score;
}

function eventCardHtml(e: Event): string {
  const url = `${SITE_URL}/event/${e.id}`;
  const cover = e.cover_image_url
    ? `<img src="${e.cover_image_url}" alt="" style="width:100%;max-width:560px;height:auto;border-radius:12px;display:block;margin-bottom:12px"/>`
    : '';
  const meta: string[] = [];
  if (e.organization_name) meta.push(escapeHtml(e.organization_name));
  if (e.city) meta.push(escapeHtml(e.city));
  if (e.deadline) {
    const d = new Date(e.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    meta.push(`до ${d}`);
  }
  return `
    <div style="border:1px solid #e5e5e5;border-radius:14px;padding:16px;margin-bottom:14px">
      ${cover}
      <a href="${url}" style="font-size:18px;color:#0a0a0a;font-weight:600;text-decoration:none">${escapeHtml(e.title)}</a>
      <div style="color:#666;font-size:13px;margin-top:6px">${meta.join(' \u00b7 ')}</div>
      ${e.short_description ? `<div style="color:#333;margin-top:10px;font-size:14px;line-height:1.5">${escapeHtml(e.short_description)}</div>` : ''}
      <a href="${url}" style="display:inline-block;margin-top:12px;padding:10px 16px;border-radius:999px;background:#0a0a0a;color:#fff;font-size:14px;text-decoration:none">Подробнее</a>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

function buildEmail(profile: Profile, events: Event[]): { subject: string; html: string } {
  const greeting = profile.full_name ? `Привет, ${escapeHtml(profile.full_name.split(' ')[0])}!` : 'Привет!';
  const subject = `Op Finder \u00b7 ${events.length} нов${events.length === 1 ? 'ое' : events.length < 5 ? 'ых' : 'ых'} событи${events.length === 1 ? 'е' : 'й'} для тебя`;
  const html = `
<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafafa;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;background:#fff">
    <h1 style="font-size:24px;margin:0 0 8px 0">${greeting}</h1>
    <p style="color:#666;font-size:15px;margin:0 0 24px 0">Подобрали новые возможности по твоим интересам — за прошедшую неделю.</p>
    ${events.map(eventCardHtml).join('')}
    <hr style="border:0;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#999;font-size:12px;margin:0">
      Получено от <a href="${SITE_URL}" style="color:#666">Op Finder</a>.
      <a href="${SITE_URL}/profile" style="color:#666">Управление подпиской</a>.
    </p>
  </div>
</body></html>`;
  return { subject, html };
}

async function sendEmail(to: string, subject: string, html: string) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  return { ok: r.ok, status: r.status, body: await r.text() };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { dry_run = false, limit = 200 } = await req.json().catch(() => ({}));
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    const since = new Date(Date.now() - 7 * 86400_000).toISOString();

    const { data: rawEvents, error: evErr } = await supa
      .from('events')
      .select('id,title,short_description,category,city,format,cover_image_url,deadline,organization_name,created_at,status')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200);
    if (evErr) throw evErr;

    const events = (rawEvents || []).filter((e: any) => !e.status || e.status === 'published') as Event[];
    if (events.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no_new_events' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { data: profiles, error: pErr } = await supa
      .from('profiles')
      .select('id,email,full_name,interests,city,digest_subscribed')
      .eq('digest_subscribed', true)
      .not('email', 'is', null)
      .limit(limit);
    if (pErr) throw pErr;

    const sent: { email: string; count: number; ok: boolean }[] = [];

    for (const profile of (profiles || []) as Profile[]) {
      // Pick top up to 6 events for this user
      const ranked = events
        .map(e => ({ e, score: rankEventForUser(e, profile) }))
        .sort((a, b) => b.score - a.score)
        .filter(r => r.score > 0)
        .slice(0, 6)
        .map(r => r.e);
      // Fallback to most recent 4 if no interest match
      const picked = ranked.length > 0 ? ranked : events.slice(0, 4);
      if (picked.length === 0) continue;

      const { subject, html } = buildEmail(profile, picked);
      let ok = true;
      if (!dry_run) {
        const r = await sendEmail(profile.email, subject, html);
        ok = r.ok;
        await supa.from('digest_log').insert({
          user_email: profile.email,
          events_count: picked.length,
        }).then(() => {}, () => {});
      }
      sent.push({ email: profile.email, count: picked.length, ok });
    }

    return new Response(JSON.stringify({ ok: true, sent: sent.length, events_in_window: events.length, results: sent.slice(0, 50) }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
