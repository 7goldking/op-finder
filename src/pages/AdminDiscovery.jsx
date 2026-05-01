import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ADMIN_EMAILS = ['kanievbahtiar02@gmail.com', 'gqk726@gmail.com'];
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function AdminDiscovery() {
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [sources, setSources] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loadingSourceId, setLoadingSourceId] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!ADMIN_EMAILS.includes(user.email)) {
      navigate('/home');
      return;
    }
    refresh();
  }, [user, navigate]);

  const refresh = async () => {
    const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
    const [s, r] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/discovery_sources?select=*&order=name.asc`, { headers }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/discovery_runs?select=*,discovery_sources(name)&order=started_at.desc&limit=20`, { headers }).then(r => r.json()),
    ]);
    setSources(s || []);
    setRuns(r || []);
  };

  const triggerRun = async (sourceId = null) => {
    if (sourceId) setLoadingSourceId(sourceId);
    else setLoadingAll(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/discover-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(sourceId ? { source_id: sourceId } : {}),
      });
      const data = await r.json();
      if (data.ok) {
        toast.success(`Готово. Добавлено: ${data.total_inserted}`);
      } else {
        toast.error(data.error || 'Ошибка');
      }
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingSourceId(null);
      setLoadingAll(false);
    }
  };

  const toggleSource = async (s) => {
    await fetch(`${SUPABASE_URL}/rest/v1/discovery_sources?id=eq.${s.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ enabled: !s.enabled }),
    });
    refresh();
  };

  if (!user || !ADMIN_EMAILS.includes(user.email)) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-violet-500" />
            AI Event Discovery
          </h1>
          <p className="text-muted-foreground mt-1">Агент находит события из публичных источников и публикует в каталог</p>
        </div>
        <Button onClick={() => triggerRun()} disabled={loadingAll} className="bg-violet-600 hover:bg-violet-700 text-white">
          {loadingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Запустить все источники
        </Button>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold mb-3">Источники ({sources.length})</h2>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {sources.map(s => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${s.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.enabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline truncate block">
                  {s.url}
                </a>
                {s.last_scanned_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Последний прогон: {format(new Date(s.last_scanned_at), 'd MMM HH:mm', { locale: ru })} · найдено: {s.events_found_total ?? 0}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleSource(s)}>
                  {s.enabled ? 'Отключить' : 'Включить'}
                </Button>
                <Button size="sm" onClick={() => triggerRun(s.id)} disabled={loadingSourceId === s.id}>
                  {loadingSourceId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-3">Последние запуски</h2>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {runs.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Запусков пока нет</div>}
          {runs.map(r => (
            <div key={r.id} className="p-4 flex items-center justify-between gap-4 text-sm">
              <div>
                <div className="font-medium">{r.discovery_sources?.name || 'Unknown'}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(r.started_at), 'd MMM HH:mm', { locale: ru })} ·{' '}
                  <span className={r.status === 'success' ? 'text-green-600' : r.status === 'error' ? 'text-red-600' : ''}>
                    {r.status}
                  </span>
                </div>
                {r.error_message && (
                  <div className="text-xs text-red-600 mt-1 line-clamp-2">{r.error_message}</div>
                )}
              </div>
              <div className="text-xs text-right">
                <div>извлечено: <strong>{r.events_extracted}</strong></div>
                <div className="text-green-600">добавлено: <strong>{r.events_inserted}</strong></div>
                <div className="text-muted-foreground">пропуски (дубли): {r.events_skipped_duplicates}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 rounded-2xl p-5 text-sm">
        <h3 className="font-semibold mb-2">Как это работает</h3>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Включённые источники по очереди скачиваются (HTML).</li>
          <li>Llama 3.3 70B на Groq извлекает структурированные события (название, дедлайн, категория, ссылка).</li>
          <li>Дубли (по external_url + title) пропускаются.</li>
          <li>События публикуются в каталог с пометкой <code>discovery_source = 'ai-agent'</code>.</li>
          <li>В UI появляется фиолетовый бейдж 🤖 AI и плашка с ссылкой на оригинал.</li>
          <li>Если организация позже подключится — события переподвяжем к её Verified-профилю.</li>
        </ol>
      </section>
    </div>
  );
}
