import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { STATUS_LABELS } from '@/lib/categories';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function OrgApplications() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.entities.Event.filter({ id: eventId }).then(l => setEvent(l[0]));
    base44.entities.Application.filter({ event_id: eventId }, '-created_date', 200).then(setApps);
  }, [eventId]);

  const updateStatus = async (appId, status) => {
    const app = apps.find(a => a.id === appId);
    await base44.entities.Application.update(appId, { status });
    setApps(a => a.map(x => x.id === appId ? { ...x, status } : x));
    if (selected?.id === appId) setSelected(prev => ({ ...prev, status }));
    toast.success('Статус обновлён');

    // Send notification to applicant
    if (['accepted', 'rejected', 'in_review'].includes(status) && app?.user_email) {
      const typeMap = { accepted: 'application_accepted', rejected: 'application_rejected', in_review: 'application_in_review' };
      await base44.entities.Notification.create({
        user_email: app.user_email,
        type: typeMap[status],
        event_title: app.event_title || event?.title || '',
        event_id: app.event_id,
        application_id: appId,
        read: false,
      });
    }
  };

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  const exportCSV = () => {
    const headers = ['Имя', 'Email', 'Город', 'Статус', 'Дата', 'Ответы'];
    const rows = apps.map(a => [
      a.user_name, a.user_email, a.user_city, STATUS_LABELS[a.status]?.label,
      a.submitted_at ? format(new Date(a.submitted_at), 'yyyy-MM-dd') : '',
      (a.answers || []).map(x => `${x.field_label}: ${x.value_text || x.value_file_url || ''}`).join(' | '),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `applications-${eventId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <button onClick={() => navigate('/org')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> К панели
      </button>

      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Заявки</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">{event?.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-10 rounded-full w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все ({apps.length})</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label} ({apps.filter(a => a.status === k).length})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV} className="rounded-full">Экспорт CSV</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
        {/* List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl text-muted-foreground">
              Заявок пока нет
            </div>
          ) : filtered.map(a => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === a.id ? 'border-foreground bg-secondary/50' : 'border-border hover:border-foreground/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{a.user_name || a.user_email}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.user_email}</div>
                  {a.submitted_at && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(a.submitted_at), 'd MMM yyyy', { locale: ru })}
                    </div>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:sticky lg:top-24 h-fit">
          {selected ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h3 className="font-display text-xl font-semibold">{selected.user_name || 'Без имени'}</h3>
                  <a href={`mailto:${selected.user_email}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {selected.user_email}
                  </a>
                  {selected.user_city && <div className="text-sm text-muted-foreground">{selected.user_city}</div>}
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="mb-6">
                <Select value={selected.status} onValueChange={v => updateStatus(selected.id, v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {(selected.answers || []).map((ans, i) => (
                  <div key={i}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {ans.field_label}
                    </div>
                    {ans.value_file_url ? (
                      <a href={ans.value_file_url} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 text-sm underline underline-offset-4">
                        {ans.value_text || 'Файл'} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{ans.value_text || <span className="text-muted-foreground">—</span>}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Выбери заявку, чтобы увидеть детали
            </div>
          )}
        </div>
      </div>
    </div>
  );
}