import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { fields, targetLang } = await req.json();

    // Don't translate if target is Russian (source language)
    if (!targetLang || targetLang === 'ru') {
      return Response.json({ translated: fields });
    }

    const langName = targetLang === 'en' ? 'English' : targetLang;

    const prompt = `Translate the following JSON fields to ${langName}. 
Keep all keys exactly as-is. Only translate the values.
Return ONLY valid JSON object with the same keys.
Preserve markdown formatting, URLs, names of organizations and events (don't translate proper nouns).
Fields to translate:
${JSON.stringify(fields, null, 2)}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: Object.fromEntries(
          Object.keys(fields).map(k => [k, { type: 'string' }])
        ),
      },
    });

    return Response.json({ translated: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});