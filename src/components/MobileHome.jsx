import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { getCategory, daysUntil } from '@/lib/categories';
import MobileEventCard from '@/components/MobileEventCard';
import { useI18n } from '@/lib/i18n';

/**
 * Mobile-only home screen that matches op_finder_mobile_bw.html mockup.
 * Renders ONLY on mobile (<md). Desktop Home is untouched.
 */
export default function MobileHome() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: null, orgs: null, events: null });

  useEffect(() => {
    let alive = true;
    supabase.rpc('get_platform_stats').then(({ data }) => {
      if (!alive || !data) return;
      setStats({
        users: data.users ?? 0,
        orgs: data.orgs ?? 0,
        events: data.events ?? 0,
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    // Prefer personalized_feed (18 items); fall back to recent.
    supabase.rpc('personalized_feed', { p_limit: 18 }).then(({ data, error }) => {
      if (!alive) return;
      if (data && data.length && !error) {
        setEvents(data.map((e) => ({
          ...e,
          application_deadline: e.deadline,
          cover_url: e.cover_image_url,
        })));
        setLoading(false);
      } else {
        base44.entities.Event.filter({ status: 'published' }, '-created_date', 18)
          .then((res) => alive && setEvents(res))
          .finally(() => alive && setLoading(false));
      }
    }).catch(() => {
      base44.entities.Event.filter({ status: 'published' }, '-created_date', 18)
        .then((res) => alive && setEvents(res))
        .finally(() => alive && setLoading(false));
    });
    return () => { alive = false; };
  }, []);

  // Split events: featured = <=7 days deadline; latest = rest.
  const withDays = events.map((e) => ({ ...e, _days: daysUntil(e.application_deadline) }));
  const featured = withDays
    .filter((e) => e._days !== null && e._days >= 0 && e._days <= 14)
    .sort((a, b) => a._days - b._days)
    .slice(0, 6);
  const latest = events.slice(0, 8);

  const quickChips = [
    { key: 'all', label: lang === 'en' ? 'All' : 'Все', to: '/catalog' },
    { key: 'grant', label: lang === 'en' ? 'Grants' : 'Гранты', to: '/catalog?category=grant' },
    { key: 'internship', label: lang === 'en' ? 'Internships' : 'Стажировки', to: '/catalog?category=internship' },
    { key: 'hackathon', label: lang === 'en' ? 'Hackathons' : 'Хакатоны', to: '/catalog?category=hackathon' },
    { key: 'scholarship', label: lang === 'en' ? 'Scholarships' : 'Стипендии', to: '/catalog?category=scholarship' },
    { key: 'online', label: lang === 'en' ? 'Online' : 'Онлайн', to: '/catalog?format=online' },
  ];

  const dayLabel = (days) => {
    if (days === null) return '';
    if (days === 0) return lang === 'en' ? 'today' : 'сегодня';
    if (days === 1) return lang === 'en' ? '1 day' : '1 день';
    if (days < 5) return lang === 'en' ? `${days} days` : `${days} дня`;
    return lang === 'en' ? `${days} days` : `${days} дней`;
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-3 pb-3.5">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
          {lang === 'en' ? <>Find your<br/>opportunity</> : <>Найди свою<br/>возможность</>}
        </h1>
        <button
          onClick={() => navigate('/dashboard')}
          aria-label="menu"
          className="w-[34px] h-[34px] rounded-full bg-secondary flex items-center justify-center"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (search.trim()) navigate(`/catalog?q=${encodeURIComponent(search.trim())}`);
        }}
        className="relative mx-5 mb-3.5"
      >
        <Search className="w-[15px] h-[15px] absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'en' ? 'Grants, internships, hackathons...' : 'Гранты, стажировки, хакатоны...'}
          className="w-full bg-secondary border border-border rounded-[10px] pl-[38px] pr-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition"
        />
      </form>

      {/* Chips */}
      <div className="flex gap-[7px] px-5 pb-4 overflow-x-auto scrollbar-hide">
        {quickChips.map((c, i) => (
          <button
            key={c.key}
            onClick={() => navigate(c.to)}
            className={
              'whitespace-nowrap px-3.5 py-1.5 rounded-full border text-[12px] font-medium shrink-0 transition ' +
              (i === 0
                ? 'bg-foreground border-foreground text-background'
                : 'bg-transparent border-border text-muted-foreground active:bg-secondary')
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Featured — горят дедлайны */}
      {featured.length > 0 && (
        <>
          <div className="flex items-center justify-between px-5 pb-2.5">
            <div className="text-[13px] font-semibold tracking-tight">
              {lang === 'en' ? 'Burning deadlines' : 'Горят дедлайны'}
            </div>
            <Link to="/catalog?sort=deadline" className="text-[12px] text-muted-foreground font-medium">
              {lang === 'en' ? 'See all' : 'Смотреть все'}
            </Link>
          </div>

          <div className="flex gap-2.5 px-5 pb-5 overflow-x-auto scrollbar-hide">
            {featured.map((ev, i) => {
              const cat = getCategory(ev.category, ev.category_custom, lang);
              const urgent = ev._days !== null && ev._days <= 3;
              const inv = i % 2 === 1;
              return (
                <Link
                  key={ev.id}
                  to={`/event/${ev.id}`}
                  className={
                    'relative shrink-0 w-[240px] rounded-[14px] p-[18px] overflow-hidden ' +
                    (inv
                      ? 'bg-secondary border border-border text-foreground'
                      : 'bg-foreground text-background')
                  }
                >
                  <span
                    className={
                      'absolute right-[-16px] bottom-[-16px] w-20 h-20 rounded-full ' +
                      (inv ? 'bg-foreground/5' : 'bg-white/10')
                    }
                  />
                  <div
                    className={
                      'text-[10px] font-semibold uppercase tracking-wider mb-2 ' +
                      (inv ? 'text-foreground opacity-80' : 'opacity-60')
                    }
                  >
                    {cat.label}
                  </div>
                  <div
                    className={
                      'text-[14px] font-bold leading-snug tracking-tight mb-5 line-clamp-3 ' +
                      (inv ? '' : '')
                    }
                  >
                    {ev.title}
                  </div>
                  <div className="flex items-center justify-between relative">
                    <div className={'text-[11px] ' + (inv ? 'text-muted-foreground' : 'opacity-60')}>
                      {ev.organization_name || '—'}
                    </div>
                    <div
                      className={
                        'text-[11px] font-semibold px-2.5 py-[3px] rounded-full ' +
                        (urgent
                          ? 'bg-[#c0392b]/15 text-[#c0392b]'
                          : inv
                          ? 'bg-foreground/10 text-foreground'
                          : 'bg-white/15 text-background')
                      }
                    >
                      {ev._days !== null ? dayLabel(ev._days) : ''}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Stats row (users / orgs / events) */}
      <div className="grid grid-cols-3 gap-[1px] bg-border mx-5 mb-5 rounded-[10px] overflow-hidden">
        {[
          { n: stats?.users ?? '—', l: t('home.statsUsers') },
          { n: stats?.orgs ?? '—', l: t('home.statsOrgs') },
          { n: stats?.events ?? '—', l: t('home.statsEvents') },
        ].map((s, i) => (
          <div key={i} className="bg-secondary py-3 text-center">
            <div className="text-[17px] font-bold tracking-tight tabular-nums">
              {typeof s.n === 'number' ? s.n.toLocaleString('ru-RU') : s.n}
            </div>
            <div className="text-[10px] font-medium text-muted-foreground mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Submit CTA */}
      <Link
        to="/submit"
        className="mx-5 mb-5 flex items-center gap-3 px-4 py-3 rounded-[10px] bg-secondary border border-border active:opacity-80"
      >
        <div className="w-8 h-8 rounded-[7px] bg-foreground flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-background" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate">
            {lang === 'en' ? 'Know an opportunity?' : 'Знаешь возможность?'}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {lang === 'en' ? 'Submit it — we\'ll publish after review' : 'Предложи — опубликуем после модерации'}
          </div>
        </div>
        <span className="text-muted-foreground text-[13px]">›</span>
      </Link>

      {/* Latest section */}
      <div className="flex items-center justify-between px-5 pb-2.5">
        <div className="text-[13px] font-semibold tracking-tight">
          {lang === 'en' ? 'Latest today' : 'Новые сегодня'}
        </div>
        <Link to="/catalog" className="text-[12px] text-muted-foreground font-medium">
          {lang === 'en' ? `All ${stats?.events ?? ''}` : `Все ${stats?.events ?? ''}`}
        </Link>
      </div>

      {loading ? (
        <div className="px-5 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[108px] rounded-[14px] bg-secondary animate-pulse" />
          ))}
        </div>
      ) : latest.length === 0 ? (
        <div className="mx-5 text-center py-10 border border-dashed border-border rounded-[14px] text-[13px] text-muted-foreground">
          {t('home.noEvents')}
        </div>
      ) : (
        <div className="px-5 space-y-2.5">
          {latest.map((ev) => <MobileEventCard key={ev.id} event={ev} />)}
        </div>
      )}
    </div>
  );
}
