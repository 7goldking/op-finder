import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/api/supabaseClient';

export function useTranslate(fields) {
  const { lang } = useI18n();
  const [translated, setTranslated] = useState(fields);
  const [translating, setTranslating] = useState(false);
  const cache = useRef({});

  useEffect(() => {
    if (!fields || Object.values(fields).every(v => !v)) return;
    if (lang === 'ru') { setTranslated(fields); return; }
    const key = lang + '|' + JSON.stringify(fields);
    if (cache.current[key]) { setTranslated(cache.current[key]); return; }
    setTranslating(true);
    supabase.functions.invoke('translate-content', { body: { fields, targetLang: lang } })
      .then(({ data }) => {
        const r = data?.translated || fields;
        cache.current[key] = r;
        setTranslated(r);
      })
      .catch(() => setTranslated(fields))
      .finally(() => setTranslating(false));
  }, [lang, JSON.stringify(fields)]);

  return { translated, translating };
}
