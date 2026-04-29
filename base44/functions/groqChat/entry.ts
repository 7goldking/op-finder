import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { systemPrompt, messages, model } = body;

    // Ensure messages is an array
    if (!Array.isArray(messages)) {
      return Response.json({ error: 'messages must be an array' }, { status: 400 });
    }

    // Determine which API to use based on model
    const useOpenAI = model === 'gpt4o' || model === 'gpt4o_claude';
    const useGroq = !useOpenAI;

    let reply;

    if (useOpenAI) {
      const openaiModel = 'gpt-4o';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return Response.json({ error: data.error?.message || 'OpenAI API error' }, { status: response.status });
      }
      reply = data.choices?.[0]?.message?.content || 'Нет ответа';
    } else {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return Response.json({ error: data.error?.message || 'Groq API error' }, { status: response.status });
      }
      reply = data.choices?.[0]?.message?.content || 'Нет ответа';
    }

    return Response.json({ reply });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});