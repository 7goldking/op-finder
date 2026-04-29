// Telegram bot webhook for Op Finder.
//
// Setup:
//   1. Create bot via @BotFather → get TELEGRAM_BOT_TOKEN.
//   2. Set Supabase secret: TELEGRAM_BOT_TOKEN.
//   3. Register webhook URL with Telegram:
//      curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
//        -d "url=https://<project-ref>.supabase.co/functions/v1/telegram-webhook"
//
// Commands:
//   /start <token>  → links Telegram chat to a Op Finder profile
//   /start          → shows greeting & link instructions
//   /stop           → unsubscribes
//   /interests      → shows currently subscribed interests
//   /events         → top 5 fresh events
//   any text        → fallback help
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SITE_URL = Deno.env.get('SITE_URL') || 'https://op-finder-1777440052.netlify.app';

async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

function escapeMd(s: string): string {
  // For MarkdownV2
  return s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

const HELP = [
  '\u041f\u0440\u0438\u0432\u0435\u0442! \u042f \u2014 \u0431\u043e\u0442 *Op Finder*\\.',
  '',
  '\u0427\u0442\u043e\u0431\u044b \u043f\u043e\u043b\u0443\u0447\u0430\u0442\u044c \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u043e \u043d\u043e\u0432\u044b\u0445 \u0441\u043e\u0431\u044b\u0442\u0438\u044f\u0445 \u043f\u043e \u0442\u0432\u043e\u0438\u043c \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u0430\u043c:',
  '1\\. \u0417\u0430\u0439\u0434\u0438 \u0432 \u0441\u0432\u043e\u0439 \u043f\u0440\u043e\u0444\u0438\u043b\u044c \u043d\u0430 [Op Finder](' + SITE_URL + '/profile)',
  '2\\. \u041d\u0430\u0436\u043c\u0438 \u00ab\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c Telegram\u00bb \u2014 \u043e\u0442\u043a\u0440\u043e\u0435\u0442\u0441\u044f \u0441\u0441\u044b\u043b\u043a\u0430 \u0432 \u0431\u043e\u0442\u0430',
  '3\\. \u041f\u0435\u0440\u0435\u0439\u0434\u0438 \u043f\u043e \u044d\u0442\u043e\u0439 \u0441\u0441\u044b\u043b\u043a\u0435 \u2014 \u0438 \u0432\u0441\u0451 \u0433\u043e\u0442\u043e\u0432\u043e',
  '',
  '\u041a\u043e\u043c\u0430\u043d\u0434\u044b: /events /interests /stop',
].join('\n');

async function findProfileByToken(supa: any, token: string) {
  const { data } = await supa
    .from('profiles')
    .select('id,email,full_name,interests')
    .eq('telegram_link_token', token)
    .limit(1);
  return data?.[0] || null;
}

async function findProfileByChatId(supa: any, chatId: string) {
  const { data } = await supa
    .from('profiles')
    .select('id,email,full_name,interests,telegram_subscribed')
    .eq('telegram_chat_id', chatId)
    .limit(1);
  return data?.[0] || null;
}

async function fetchFreshEvents(supa: any, interests: string[] | null) {
  const since = new Date(Date.now() - 14 * 86400_000).toISOString();
  let q = supa
    .from('events')
    .select('id,title,short_description,category,city,deadline,organization_name,created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20);
  const { data } = await q;
  let list = data || [];
  if (interests && interests.length > 0) {
    list = list.filter((e: any) => !e.category || interests.includes(e.category));
  }
  return list.slice(0, 5);
}

async function handleUpdate(update: any, supa: any) {
  const msg = update.message || update.edited_message;
  if (!msg) return;
  const chatId = String(msg.chat.id);
  const text = (msg.text || '').trim();

  if (text.startsWith('/start')) {
    const arg = text.split(/\s+/, 2)[1];
    if (arg) {
      const profile = await findProfileByToken(supa, arg);
      if (!profile) {
        await tg('sendMessage', {
          chat_id: chatId,
          text: '\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u0430\\. \u041e\u0442\u043a\u0440\u043e\u0439 \u0441\u0432\u043e\u0439 \u043f\u0440\u043e\u0444\u0438\u043b\u044c \u043d\u0430 Op Finder \u0438 \u043d\u0430\u0436\u043c\u0438 \u00ab\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c Telegram\u00bb \u0435\u0449\u0451 \u0440\u0430\u0437\\.',
          parse_mode: 'MarkdownV2',
        });
        return;
      }
      await supa.from('profiles').update({
        telegram_chat_id: chatId,
        telegram_subscribed: true,
        telegram_link_token: null,
      }).eq('id', profile.id);
      await tg('sendMessage', {
        chat_id: chatId,
        text: '\u0413\u043e\u0442\u043e\u0432\u043e, ' + escapeMd(profile.full_name || 'друг') + '\\! \u0411\u0443\u0434\u0443 \u043f\u0440\u0438\u0441\u044b\u043b\u0430\u0442\u044c \u0442\u0435\u0431\u0435 \u0441\u0432\u0435\u0436\u0438\u0435 \u0441\u043e\u0431\u044b\u0442\u0438\u044f \u043f\u043e \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u0430\u043c\\. \u041a\u043e\u043c\u0430\u043d\u0434\u044b: /events /interests /stop',
        parse_mode: 'MarkdownV2',
      });
      return;
    }
    await tg('sendMessage', { chat_id: chatId, text: HELP, parse_mode: 'MarkdownV2', disable_web_page_preview: true });
    return;
  }

  if (text === '/stop') {
    await supa.from('profiles').update({ telegram_subscribed: false }).eq('telegram_chat_id', chatId);
    await tg('sendMessage', { chat_id: chatId, text: '\u041e\u043a, \u043e\u0442\u043f\u0438\u0441\u0430\u043b \u0442\u0435\u0431\u044f\u002e \u0427\u0442\u043e\u0431\u044b \u0432\u0435\u0440\u043d\u0443\u0442\u044c \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u2014 \u043d\u0430\u043f\u0438\u0448\u0438 /start' });
    return;
  }

  if (text === '/interests') {
    const profile = await findProfileByChatId(supa, chatId);
    if (!profile) {
      await tg('sendMessage', { chat_id: chatId, text: '\u0422\u044b \u0435\u0449\u0451 \u043d\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d\u002e \u041e\u0442\u043a\u0440\u043e\u0439 \u043f\u0440\u043e\u0444\u0438\u043b\u044c \u043d\u0430 Op Finder.' });
      return;
    }
    const list = profile.interests?.length ? profile.interests.join(', ') : '(\u043f\u0443\u0441\u0442\u043e \u2014 \u0443\u043a\u0430\u0436\u0438 \u0432 \u043f\u0440\u043e\u0444\u0438\u043b\u0435)';
    await tg('sendMessage', { chat_id: chatId, text: '\u0422\u0432\u043e\u0438 \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u044b: ' + list });
    return;
  }

  if (text === '/events') {
    const profile = await findProfileByChatId(supa, chatId);
    const events = await fetchFreshEvents(supa, profile?.interests || null);
    if (events.length === 0) {
      await tg('sendMessage', { chat_id: chatId, text: '\u041d\u043e\u0432\u044b\u0445 \u0441\u043e\u0431\u044b\u0442\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442. \u0413\u043b\u044f\u043d\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433: ' + SITE_URL + '/catalog' });
      return;
    }
    const lines = events.map((e: any) => {
      const url = `${SITE_URL}/event/${e.id}`;
      const meta = [e.organization_name, e.city].filter(Boolean).join(' \u00b7 ');
      return `\u2022 [${escapeMd(e.title)}](${url})${meta ? '\n  ' + escapeMd(meta) : ''}`;
    });
    await tg('sendMessage', {
      chat_id: chatId,
      text: '*\u0421\u0432\u0435\u0436\u0438\u0435 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438:*\n\n' + lines.join('\n\n'),
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    });
    return;
  }

  // Fallback
  await tg('sendMessage', { chat_id: chatId, text: HELP, parse_mode: 'MarkdownV2', disable_web_page_preview: true });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('ok', { headers: cors });
  if (!BOT_TOKEN) return new Response('TELEGRAM_BOT_TOKEN not set', { status: 500, headers: cors });
  try {
    const update = await req.json();
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    await handleUpdate(update, supa);
    return new Response('ok', { headers: cors });
  } catch (e) {
    console.error(e);
    return new Response('ok', { headers: cors }); // always 200 to telegram
  }
});
