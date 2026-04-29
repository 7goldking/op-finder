import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { to, subject, body } = await req.json();
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}` },
      body: JSON.stringify({ from: 'Op Finder <noreply@kazyouthdiplomacy.com>', to: [to], subject, html: body }),
    });
    const d = await r.json();
    return new Response(JSON.stringify(d), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
