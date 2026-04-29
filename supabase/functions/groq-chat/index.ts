import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { systemPrompt, messages } = await req.json();
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 1024, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
    });
    const d = await r.json();
    const reply = d.choices?.[0]?.message?.content || 'Нет ответа';
    return new Response(JSON.stringify({ reply }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
