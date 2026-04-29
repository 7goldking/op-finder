import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { prompt, response_json_schema } = await req.json();
    const systemPrompt = response_json_schema
      ? 'Отвечай ТОЛЬКО валидным JSON без markdown. Никакого текста до или после JSON.'
      : 'Ты полезный ИИ-ассистент.';
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2048, system: systemPrompt, messages: [{ role: 'user', content: prompt }] }),
    });
    const d = await r.json();
    const result = d.content?.[0]?.text || '';
    return new Response(JSON.stringify({ result }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
