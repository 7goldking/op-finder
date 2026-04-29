import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Eye, FileText, TrendingUp, Pencil, Trash2, ExternalLink, Code2, Copy } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getCategory } from '@/lib/categories';
import ConversionChart from '@/components/ConversionChart';
import DemographicsChart from '@/components/DemographicsChart';
import OrgBadges from '@/components/OrgBadges';
import OrgAnalytics from '@/components/OrgAnalytics';

export default function OrgDashboard() {
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [events, setEvents] = useState([]);
  const [apps, setApps] = useState([]);
  const [org, setOrg] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.account_type !== 'organization' || !user.organization_id) {
      navigate('/onboarding');
      return;
    }
    Promise.all([
      base44.entities.Organization.filter({ id: user.organization_id }),
      base44.entities.Event.filter({ organization_id: user.organization_id }, '-created_date', 100),
    ]).then(async ([o, e]) => {
      setOrg(o[0]);
      setEvents(e);
      const ids = e.map(x => x.id);
      const lists = await Promise.all(ids.map(id => base44.entities.Application.filter({ event_id: id })));
      const allApps = lists.flat();

      // Enrich with applicant demographics
      const emails = [...new Set(allApps.map(a => a.user_email).filter(Boolean))];
      const users = await Promise.all(emails.map(em => base44.entities.User.filter({ email: em }).catch(() => [])));
      const userMap = {};
      users.flat().forEach(u => { userMap[u.email] = u; });
      const enriched = allApps.map(a => ({
        ...a,
        user_city: a.user_city || userMap[a.user_email]?.city,
        user_education: a.user_education || userMap[a.user_email]?.education_level,
        user_age: userMap[a.user_email]?.age,
      }));
      setApps(enriched);
    });
  }, [user, navigate]);

  const handleDelete = async (event) => {
    try {
      const related = await base44.entities.Application.filter({ event_id: event.id });
      await Promise.all(related.map(a => base44.entities.Application.delete(a.id)));
      await base44.entities.Event.delete(event.id);
      setEvents(prev => prev.filter(x => x.id !== event.id));
      setApps(prev => prev.filter(a => a.event_id !== event.id));
      toast.success('Событие удалено');
    } catch {
      toast.error('Не удалось удалить событие');
    }
  };

  const totalViews = events.reduce((s, e) => s + (e.views_count || 0), 0);
  const totalApps = apps.length;
  const pending = apps.filter(a => ['submitted', 'in_review'].includes(a.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground mb-2">Кабинет организации</div>
          <h1 className="font-display text-4xl font-semibold">{org?.name || '...'}</h1>
        </div>
        <Button onClick={() => navigate('/org/event/new')} className="rounded-full h-12 gap-2">
          <Plus className="w-4 h-4" /> Создать событие
        </Button>
      </div>

      {/* Brand page + embed */}
      {org && (
        <div className="mb-10 p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Публичная страница</h2>
              <p className="text-sm text-muted-foreground">Делитесь ссылкой или вставьте виджет на свой сайт</p>
            </div>
            <Link to={`/o/${org.slug || org.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full gap-2"><ExternalLink className="w-4 h-4" />Открыть страницу</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-secondary">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Ссылка</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-xs font-mono">{`${typeof window !== 'undefined' ? window.location.origin : ''}/o/${org.slug || org.id}`}</code>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full h-8 w-8 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/o/${org.slug || org.id}`);
                    toast.success('Ссылка скопирована');
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Code2 className="w-3 h-3" /> Embed</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-xs font-mono">{`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/org/${org.slug || org.id}" ...`}</code>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full h-8 w-8 shrink-0"
                  onClick={() => {
                    const code = `<iframe src="${window.location.origin}/embed/org/${org.slug || org.id}" style="width:100%;min-height:520px;border:0;border-radius:16px" loading="lazy" title="${org.name} — Op Finder"></iframe>`;
                    navigator.clipboard.writeText(code);
                    toast.success('Код виджета скопирован');
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Stat icon={FileText} value={events.length} label="Событий" />
        <Stat icon={Eye} value={totalViews} label="Просмотров" />
        <Stat icon={TrendingUp} value={totalApps} label="Заявок" />
        <Stat icon={FileText} value={pending} label="Ожидают" accent />
      </div>

      {/* Conversion chart */}
      {events.length > 0 && (
        <div className="mb-10 p-6 rounded-2xl border border-border bg-card">
          <div className="mb-1">
            <h2 className="font-display text-xl font-semibold">Конверсия</h2>
            <p className="text-sm text-muted-foreground">Просмотры vs заявки по событиям</p>
          </div>
          <div className="mt-5">
            <ConversionChart events={events} apps={apps} />
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted-foreground/40 inline-block" /> Просмотры</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-foreground inline-block" /> Заявки</span>
          </div>
        </div>
      )}

      {/* Org badges */}
      <div className="mb-10">
        <OrgBadges user={user} org={org} events={events} applicationsCount={apps.length} />
      </div>

      {/* Advanced Analytics */}
      <OrgAnalytics apps={apps} events={events} />

      {/* Demographics */}
      {apps.length > 0 && (
        <div className="mb-10">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold">Демография участников</h2>
            <p className="text-sm text-muted-foreground">Кто подаёт заявки на ваши события</p>
          </div>
          <DemographicsChart applicants={apps} />
        </div>
      )}

      {/* Events list */}
      <h2 className="font-display text-2xl font-semibold mb-4">События</h2>
      {events.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground mb-4">Ещё нет событий</p>
          <Button onClick={() => navigate('/org/event/new')} className="rounded-full">Создать первое</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(e => {
            const count = apps.filter(a => a.event_id === e.id).length;
            const cat = getCategory(e.category);
            return (
              <div key={e.id} className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden shrink-0">
                  {e.cover_url ? <img src={e.cover_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-secondary text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-center p-1">{cat.label}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{cat.label}</div>
                  <h3 className="font-display text-lg font-semibold truncate">{e.title}</h3>
                  <div className="text-xs text-muted-foreground mt-1">
                    Создано {format(new Date(e.created_date), 'd MMM yyyy', { locale: ru })}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{e.views_count || 0}</div>
                    <div className="text-xs text-muted-foreground">просмотров</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{count}</div>
                    <div className="text-xs text-muted-foreground">заявок</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link to={`/event/${e.id}`}>
                    <Button variant="outline" size="sm" className="rounded-full">Посмотреть</Button>
                  </Link>
                  <Link to={`/org/event/${e.id}/applications`}>
                    <Button size="sm" className="rounded-full">Заявки</Button>
                  </Link>
                  <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={() => navigate(`/org/event/${e.id}/edit`)} title="Редактировать">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full h-8 w-8 text-destructive hover:text-destructive" title="Удалить">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить событие?</AlertDialogTitle>
                        <AlertDialogDescription>
                          «{e.title}» будет удалено навсегда вместе со всеми заявками ({count}). Это действие нельзя отменить.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(e)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, value, label, accent }) {
  return (
    <div className={`p-5 rounded-2xl border ${accent ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}>
      <Icon className={`w-4 h-4 mb-3 ${accent ? 'opacity-70' : 'text-muted-foreground'}`} />
      <div className="font-display text-3xl font-semibold">{value}</div>
      <div className={`text-xs mt-1 ${accent ? 'opacity-70' : 'text-muted-foreground'}`}>{label}</div>
    </div>
  );
}