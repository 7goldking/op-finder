// Backfill embeddings for events.embedding IS NULL.
// Idempotent: each invocation processes up to BATCH events.
// Trigger: invoked manually or on schedule until table is fully embedded.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CF_ACCOUNT = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const CF_TOKEN = Deno.env.get('CLOUDFLARE_AI_TOKEN');

const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BATCH = 30;

async function embed(text: string): Promise<number[] | null> {
  if (!CF_ACCOUNT || !CF_TOKEN) return null;
  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/baai/bge-m3`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  const { data: rows, error } = await supa
    .from('events')
    .select('id, title, short_description, description')
    .is('embedding', null)
    .order('created_at', { ascending: false })
    .limit(BATCH);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let done = 0;
  let failed = 0;
  for (const row of rows || []) {
    const text = `${row.title}\n\n${row.short_description || ''}\n\n${(row.description || '').slice(0, 1500)}`;
    const emb = await embed(text);
    if (!emb) {
      failed++;
      continue;
    }
    const { error: upErr } = await supa
      .from('events')
      .update({ embedding: emb as any })
      .eq('id', row.id);
    if (upErr) failed++;
    else done++;
    // tiny pause to be nice to CF AI
    await new Promise((r) => setTimeout(r, 100));
  }

  // Remaining count for caller to know if to call again
  const { count: remaining } = await supa
    .from('events')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);

  return new Response(
    JSON.stringify({ ok: true, processed: done, failed, remaining: remaining ?? null }),
    {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    },
  );
});
