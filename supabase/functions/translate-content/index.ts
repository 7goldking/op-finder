import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { fields, targetLang } = await req.json();
    const list = Object.entries(fields).map(([k,v]) => `${k}: ${v}`).join('\n');
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024,
        messages: [{ role: 'user', content: `Переведи на "${targetLang}". Верни ТОЛЬКО JSON без markdown:\n${list}` }] }),
    });
    const d = await r.json();
    const text = d.content?.[0]?.text || '{}';
    const translated = JSON.parse(text.replace(/```json|```/g,'').trim());
    return new Response(JSON.stringify({ translated }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
