import { supabase } from './supabaseClient';
import { compressImage } from '@/lib/imageUpload';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // hard cap, post-compression

export const integrations = {
  Core: {
    async UploadFile({ file }) {
      if (!file) throw new Error('Файл не выбран');
      // Compress images client-side; non-images pass through.
      const prepared = await compressImage(file).catch(() => file);
      if (prepared.size > MAX_UPLOAD_BYTES) {
        throw new Error(`Файл слишком большой (${(prepared.size / 1024 / 1024).toFixed(1)} МБ, лимит 25 МБ)`);
      }
      const ext = (prepared.name.split('.').pop() || 'bin').toLowerCase();
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('files').upload(path, prepared, {
        upsert: false,
        contentType: prepared.type || undefined,
        cacheControl: '3600',
      });
      if (error) throw error;
      const { data } = supabase.storage.from('files').getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
    async InvokeLLM({ prompt, response_json_schema }) {
      const { data, error } = await supabase.functions.invoke('invoke-llm', {
        body: { prompt, response_json_schema },
      });
      if (error) throw error;
      if (response_json_schema) {
        try { return JSON.parse(data.result || data.text || '{}'); } catch { return {}; }
      }
      return data?.result || data?.text || '';
    },
    async SendEmail({ to, subject, body }) {
      const { error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, body },
      });
      if (error) throw error;
    },
  },
};

export const functions = {
  async invoke(name, params = {}) {
    // groqChat -> groq-chat, translateContent -> translate-content
    const fnName = name.replace(/([A-Z])/g, m => '-' + m.toLowerCase()).replace(/^-/, '');
    const { data, error } = await supabase.functions.invoke(fnName, { body: params });
    if (error) throw error;
    return { data };
  },
};
