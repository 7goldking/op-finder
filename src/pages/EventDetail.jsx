import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Globe, Bookmark, Share2, ExternalLink, Sparkles } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import EventReviews from '@/components/EventReviews';
import AddToCalendar from '@/components/AddToCalendar';
import PushNotificationsToggle from '@/components/PushNotificationsToggle';
import TeamFinder from '@/components/TeamFinder';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { getCategory, daysUntil, getLevels, getFormats } from '@/lib/categories';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { useTranslate } from '@/hooks/useTranslate';
import { Loader2 } from 'lucide-react';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  useEffect(() => {
    (async () => {
      const list = await base44.entities.Event.filter({ id });
      if (list[0]) {
        setEvent(list[0]);
        base44.entities.Event.update(id, { views_count: (list[0].views_count || 0) + 1 }).catch(() => {});
      }
      const [bms, apps] = await Promise.all([
        base44.entities.Bookmark.filter({ event_id: id }).catch(() => []),
        base44.entities.Application.filter({ event_id: id }).catch(() => []),
      ]);
      if (bms[0]) { setBookmarked(true); setBookmarkId(bms[0].id); }
      if (apps[0]) setHasApplied(true);
      setLoading(false);
    })();
  }, [id]);

  const toggleBookmark = async () => {
    if (!event) return;
    if (bookmarked && bookmarkId) {
      await base44.entities.Bookmark.delete(bookmarkId);
      setBookmarked(false); setBookmarkId(null);
      toast.success(lang === 'en' ? 'Removed from bookmarks' : 'Убрано из закладок');
    } else {
      const b = await base44.entities.Bookmark.create({
        event_id: event.id,
        event_title: event.title,
        event_cover_url: event.cover_url,
        event_deadline: event.application_deadline,
        event_category: event.category,
      });
      setBookmarked(true); setBookmarkId(b.id);
      toast.success(lang === 'en' ? 'Added to bookmarks' : 'Добавлено в закладки');
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: event.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success(lang === 'en' ? 'Link copied' : 'Ссылка скопирована');
    }
  };

  const { translated: tx, translating } = useTranslate(event ? {
    title: event.title,
    short_description: event.short_description || '',
    description: event.description || '',
    requirements: event.requirements || '',
  } : {});

  const { lang } = useI18n();
  const cat = getCategory(event?.category, event?.category_custom, lang);
  const LEVELS = getLevels(lang);
  const FORMATS = getFormats(lang);
  const days = daysUntil(event?.application_deadline);
  const past = days !== null && days < 0;

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <div className="aspect-[16/9] bg-muted rounded-2xl animate-pulse mb-8" />
      <div className="h-8 bg-muted rounded w-3/4 mb-4 animate-pulse" />
      <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
    </div>;
  }

  if (!event) {
    return <div className="max-w-4xl mx-auto px-4 md:px-8 py-20 text-center">
      <h2 className="text-2xl font-semibold mb-2">{lang === 'en' ? 'Event not found' : 'Событие не найдено'}</h2>
      <Link to="/catalog" className="text-primary underline">{lang === 'en' ? 'Back to catalog' : 'Вернуться в каталог'}</Link>
    </div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> {lang === 'en' ? 'Back' : 'Назад'}
      </button>

      {/* Cover */}
      <div className="aspect-[16/9] md:aspect-[21/9] relative overflow-hidden rounded-2xl bg-muted mb-8">
        {event.cover_url ? (
          <img src={event.cover_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <span className="text-xs font-medium uppercase tracking-widest">{cat.label}</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider">
                {cat.label}
              </span>
              {event.format && (
                <span className="px-3 py-1 rounded-full border border-border text-xs font-medium">
                  {FORMATS.find(f => f.value === event.format)?.label || event.format}
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-semibold leading-tight text-balance mb-4 flex items-start gap-3">
              {tx.title || event.title}
              {translating && <Loader2 className="w-5 h-5 mt-2 animate-spin text-muted-foreground shrink-0" />}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              {event.organization_id ? (
                <Link
                  to={`/org/${event.organization_id}`}
                  className="hover:underline underline-offset-4"
                >
                  {event.organization_name}
                </Link>
              ) : (
                <span>{event.organization_name}</span>
              )}
              {event.organization_verified && <VerifiedBadge size="md" />}
            </div>
          </div>

          {event.discovery_source === 'ai-agent' && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-900 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div className="flex-1 text-sm">
                  <div className="font-semibold mb-1">
                    {lang === 'en' ? 'Auto-discovered by AI agent' : 'Найдено AI-агентом Op Finder'}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {lang === 'en'
                      ? 'Our AI agent collected this event from public sources. Information may not be complete — verify on the original page before applying.'
                      : 'Наш AI-агент собрал это событие из публичных источников. Информация может быть неполной — перед подачей заявки проверьте оригинальную страницу.'}
                  </p>
                  {event.external_url && (
                    <a
                      href={event.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-violet-700 dark:text-violet-300 font-medium hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {lang === 'en' ? 'Open original source' : 'Открыть оригинал'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {event.short_description && (
            <p className="text-lg text-muted-foreground leading-relaxed">{tx.short_description || event.short_description}</p>
          )}

          {event.description && (
            <div className="prose prose-neutral max-w-none">
              <h3 className="font-display text-xl font-semibold mb-3">{lang === 'en' ? 'About' : 'О событии'}</h3>
              <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed">{tx.description || event.description}</div>
            </div>
          )}

          {event.requirements && (
            <div>
              <h3 className="font-display text-xl font-semibold mb-3">{lang === 'en' ? 'Requirements' : 'Требования'}</h3>
              <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed">{tx.requirements || event.requirements}</div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="font-display text-xl font-semibold mb-4">{lang === 'en' ? 'Timeline' : 'Таймлайн'}</h3>
            <div className="space-y-3">
              {event.application_deadline && (
                <TimelineItem icon={Calendar} label={lang === 'en' ? 'Application deadline' : 'Дедлайн подачи'} date={event.application_deadline} highlight={!past} lang={lang} />
              )}
              {event.event_start && <TimelineItem icon={Calendar} label={lang === 'en' ? 'Start' : 'Начало'} date={event.event_start} lang={lang} />}
              {event.event_end && <TimelineItem icon={Calendar} label={lang === 'en' ? 'End' : 'Окончание'} date={event.event_end} lang={lang} />}
              {event.result_date && <TimelineItem icon={Calendar} label={lang === 'en' ? 'Results' : 'Результаты'} date={event.result_date} lang={lang} />}
            </div>
          </div>

          {(event.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map(t => (
                <span key={t} className="px-3 py-1 rounded-full bg-secondary text-xs">#{t}</span>
              ))}
            </div>
          )}

          {/* Team finder (for hackathons/competitions) */}
          {['hackathon', 'competition'].includes(event.category) && (
            <TeamFinder event={event} user={user} />
          )}

          {/* Reviews */}
          <div className="pt-4 border-t border-border">
            <EventReviews
              eventId={event.id}
              eventTitle={event.title}
              organizationName={event.organization_name}
              organizationId={event.organization_id}
              hasApplied={hasApplied}
              user={user}
              isOrgOwner={user?.account_type === 'organization' && user?.organization_id === event.organization_id}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="md:sticky md:top-24 h-fit space-y-4">
          <div className="rounded-2xl border border-border p-6 bg-card">
            <div className="space-y-3 mb-5 text-sm">
              {event.city && (
                <InfoRow icon={MapPin} label={event.city} />
              )}
              {event.language && (
                <InfoRow icon={Globe} label={event.language === 'ru' ? (lang === 'en' ? 'Russian' : 'Русский') : event.language === 'en' ? (lang === 'en' ? 'English' : 'Английский') : (lang === 'en' ? 'Multilingual' : 'Мультиязычный')} />
              )}
              {(event.level || []).length > 0 && (
                <InfoRow icon={Users} label={event.level.map(l => LEVELS.find(x => x.value === l)?.label).join(', ')} />
              )}
              {(event.min_age || event.max_age) && (
                <InfoRow icon={Users} label={`${event.min_age || ''}${event.max_age ? '–' + event.max_age : '+'} ${lang === 'en' ? 'y.o.' : 'лет'}`} />
              )}
            </div>

            {hasApplied ? (
              <Button disabled className="w-full h-12 rounded-full">{lang === 'en' ? 'Application sent' : 'Заявка отправлена'}</Button>
            ) : past ? (
              <Button disabled className="w-full h-12 rounded-full">{lang === 'en' ? 'Applications closed' : 'Подача закрыта'}</Button>
            ) : (
              <Button onClick={() => navigate(`/event/${id}/apply`)} className="w-full h-12 rounded-full gap-2">
                {lang === 'en' ? 'Apply' : 'Подать заявку'}
                {days !== null && days <= 7 && days >= 0 && (
                  <span className="text-xs opacity-70">· {days === 0 ? (lang === 'en' ? 'today' : 'сегодня') : `${days} ${lang === 'en' ? 'd.' : 'дн.'}`}</span>
                )}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button variant="outline" onClick={toggleBookmark} className="rounded-full gap-1.5">
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                {bookmarked ? (lang === 'en' ? 'Saved' : 'В закладках') : (lang === 'en' ? 'Save' : 'Сохранить')}
              </Button>
              <Button variant="outline" onClick={share} className="rounded-full gap-1.5">
                <Share2 className="w-4 h-4" /> {lang === 'en' ? 'Share' : 'Поделиться'}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <AddToCalendar event={event} />
              <PushNotificationsToggle eventCategory={event.category} />
            </div>
          </div>

          <Link
            to="/assistant"
            state={{ prefill: `Расскажи подробнее о событии "${event.title}" и помоги решить, подходит ли оно мне.` }}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border hover:border-foreground/30 transition-colors bg-secondary/50"
          >
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{lang === 'en' ? 'Ask assistant' : 'Спросить ассистента'}</div>
              <div className="text-xs text-muted-foreground">{lang === 'en' ? 'Is this event right for you?' : 'Подходит ли тебе это событие?'}</div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2.5 text-muted-foreground">
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-foreground">{label}</span>
    </div>
  );
}

function TimelineItem({ icon: Icon, label, date, highlight, lang = 'ru' }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
      <Icon className={`w-4 h-4 mt-0.5 ${highlight ? 'text-warning' : 'text-muted-foreground'}`} />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{format(new Date(date), 'd MMMM yyyy', { locale: lang === 'en' ? enUS : ru })}</div>
      </div>
    </div>
  );
}