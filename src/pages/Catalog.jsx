import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import EventCard from '@/components/EventCard';
import FilterBar from '@/components/FilterBar';
import PullToRefresh from '@/components/PullToRefresh';
import { useI18n } from '@/lib/i18n';

export default function Catalog() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(params.get('category') || 'all');
  const [format, setFormat] = useState('all');
  const [city, setCity] = useState('all');

  const fetchEvents = useCallback(() => {
    setLoading(true);
    return base44.entities.Event.filter({ status: 'published' }, '-created_date', 100)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchEvents(); }, []);

  // Сохраняем историю поиска для улучшения рекомендаций
  useEffect(() => {
    const q = search.trim();
    if (q.length < 3) return;
    const t = setTimeout(async () => {
      try {
        const me = await base44.auth.me();
        if (!me) return;
        const history = [q, ...(me.search_history || []).filter(h => h !== q)].slice(0, 20);
        await base44.auth.updateMe({ search_history: history });
      } catch {}
    }, 1200);
    return () => clearTimeout(t);
  }, [search]);

  const cities = useMemo(() => {
    const cs = [...new Set(events.map(e => e.city).filter(Boolean))].sort();
    return cs;
  }, [events]);

  const filtered = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return events.filter(e => {
      // Hide expired events (belt-and-braces; daily cron also cleans them up in DB)
      if (e.deadline && e.deadline < todayStr) return false;
      // Hide AI-discovered events that lack a registration URL — they're unusable
      if (e.discovery_source === 'ai-agent' && !e.external_url) return false;
      if (category !== 'all' && e.category !== category) return false;
      if (format !== 'all' && e.format !== format) return false;
      if (city !== 'all' && e.city !== city) return false;

      if (search) {
        const q = search.toLowerCase();
        const hay = [e.title, e.short_description, e.organization_name, (e.tags || []).join(' ')]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, search, category, format, city]);

  return (
    <PullToRefresh onRefresh={fetchEvents}>
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-2">{t('catalog.title')}</h1>
        <p className="text-muted-foreground">{t('catalog.subtitle')}</p>
      </div>

      <div className="mb-8">
        <FilterBar
          search={search} setSearch={setSearch}
          category={category} setCategory={setCategory}
          format={format} setFormat={setFormat}
          city={city} setCity={setCity}
          cities={cities}
        />
      </div>

      <div className="flex items-center justify-between gap-4 mb-6 text-sm text-muted-foreground flex-wrap">
        <span>{loading ? t('catalog.loading') : `${t('catalog.found')}: ${filtered.length}`}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[16/12] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground mb-2">{t('catalog.empty_title')}</p>
          <p className="text-sm text-muted-foreground">{t('catalog.empty_hint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}