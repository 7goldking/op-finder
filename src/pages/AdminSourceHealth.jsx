import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, PlayCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const ADMIN_EMAILS = ['kanievbahtiar02@gmail.com', 'gqk726@gmail.com'];
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function AdminSourceHealth() {
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (!ADMIN_EMAILS.includes(user.email)) {
      navigate('/home');
      return;
    }
    refresh();
  }, [user, navigate]);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('source_health_summary');
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  const runOne = async (sourceId) => {
    setRunning(sourceId);
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/discover-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ source_id: sourceId }),
      });
      const data = await r.json();
      if (data.ok) toast.success(`+${data.total_inserted} новых событий`);
      else toast.error(data.error || 'Ошибка');
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunning(null);
    }
  };

  const runAll = async () => {
    setRunning('all');
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/discover-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (data.ok) toast.success(`Прогон завершён. +${data.total_inserted} новых`);
      else toast.error(data.error || 'Ошибка');
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunning(null);
    }
  };

  if (!user || !ADMIN_EMAILS.includes(user.email)) return null;

  const enabled = rows.filter((r) => r.enabled);
  const failing = rows.filter((r) => r.consecutive_fails >= 3);
  const totalInserted24h = rows.reduce((a, r) => a + (r.inserted_24h || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Здоровье источников</h1>
          <p className="text-gray-600 text-sm">
            {enabled.length}/{rows.length} активных · {failing.length} с ошибками · +{totalInserted24h} событий за 24ч
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Обновить
          </Button>
          <Button onClick={runAll} disabled={running === 'all'} size="sm">
            {running === 'all' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
            Запустить все
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin inline" /></div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Источник</th>
                <th className="text-left px-4 py-2">Тип</th>
                <th className="text-left px-4 py-2">Расписание</th>
                <th className="text-left px-4 py-2">Последний запуск</th>
                <th className="text-right px-4 py-2">Ошибки подряд</th>
                <th className="text-right px-4 py-2">Найдено 24ч</th>
                <th className="text-right px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.source_id} className={`border-t ${!r.enabled ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2">
                    <div className="font-medium truncate max-w-xs" title={r.name}>{r.name}</div>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-xs block">
                      {r.url}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-xs">{r.source_type}</td>
                  <td className="px-4 py-2 text-xs">каждые {r.schedule_min} мин</td>
                  <td className="px-4 py-2 text-xs">
                    {r.last_run_at ? (
                      <>
                        <div>{formatDistanceToNow(new Date(r.last_run_at), { addSuffix: true, locale: ru })}</div>
                        {r.last_error ? (
                          <div className="text-red-600 truncate max-w-xs" title={r.last_error}>
                            <AlertTriangle className="w-3 h-3 inline mr-1" />{r.last_error.slice(0, 80)}
                          </div>
                        ) : (
                          <div className="text-green-600"><CheckCircle2 className="w-3 h-3 inline mr-1" />ok</div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">никогда</span>
                    )}
                  </td>
                  <td className={`px-4 py-2 text-right ${r.consecutive_fails >= 3 ? 'text-red-600 font-bold' : ''}`}>
                    {r.consecutive_fails || 0}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className={r.inserted_24h > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      +{r.inserted_24h || 0}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      onClick={() => runOne(r.source_id)}
                      disabled={running === r.source_id || !r.enabled}
                      size="sm"
                      variant="ghost"
                    >
                      {running === r.source_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
