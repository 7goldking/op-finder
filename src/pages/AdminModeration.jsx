import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ADMIN_EMAILS = ['kanievbahtiar02@gmail.com', 'gqk726@gmail.com'];

export default function AdminModeration() {
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const { data, error } = await supabase.rpc('list_pending_submissions');
    if (error) toast.error(error.message);
    setItems(data || []);
    setLoading(false);
  };

  const approve = async (id) => {
    setBusy(id);
    const { error } = await supabase.rpc('approve_submission', { p_submission_id: id });
    if (error) toast.error(error.message);
    else toast.success('Опубликовано');
    setBusy(null);
    refresh();
  };

  const reject = async (id) => {
    const reason = prompt('Причина отказа?') || '';
    setBusy(id);
    const { error } = await supabase.rpc('reject_submission', {
      p_submission_id: id,
      p_reason: reason,
    });
    if (error) toast.error(error.message);
    else toast.success('Отклонено');
    setBusy(null);
    refresh();
  };

  if (!user || !ADMIN_EMAILS.includes(user.email)) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Модерация заявок</h1>
          <p className="text-gray-600 text-sm">{items.length} ожидают проверки</p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Обновить
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin inline" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-gray-600">Нет заявок на модерации</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight">{s.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {s.user_email || 'без email'} · {format(new Date(s.created_at), 'dd MMM HH:mm')}
                    {s.organization_name && ` · ${s.organization_name}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => approve(s.id)}
                    disabled={busy === s.id}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {busy === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={() => reject(s.id)}
                    disabled={busy === s.id}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2 line-clamp-3 whitespace-pre-wrap">{s.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {s.category && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s.category}</span>}
                {s.city && <span>📍 {s.city}</span>}
                {s.deadline && <span>⏳ до {s.deadline}</span>}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {s.url.length > 50 ? s.url.slice(0, 50) + '...' : s.url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
