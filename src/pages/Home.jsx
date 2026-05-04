import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import HeroEventFeed from '@/components/HeroEventFeed';
import EventCard from '@/components/EventCard';
import OrgMarquee from '@/components/OrgMarquee';
import AmbassadorBanner from '@/components/AmbassadorBanner';
import { getCategories } from '@/lib/categories';
import { useI18n } from '@/lib/i18n';
import { InfiniteGrid } from '@/components/ui/the-infinite-grid';


export default function Home() {
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: null, orgs: null, events: null });

  useEffect(() => {
    let alive = true;
    Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    ]).then(([u, o, e]) => {
      if (!alive) return;
      setStats({ users: u.count ?? 0, orgs: o.count ?? 0, events: e.count ?? 0 });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const { t, lang } = useI18n();
  const CATEGORIES = getCategories(lang);

  useEffect(() => {
    base44.entities.Event.filter({ status: 'published' }, '-created_date', 6)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  // Capture referral code from URL (?ref=...) and store it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('pending_ref', ref);
    }
  }, []);

  // Track referral once user is authenticated
  useEffect(() => {
    if (!user?.email) return;
    const ref = localStorage.getItem('pending_ref');
    if (!ref) return;
    base44.functions.invoke('trackReferral', { code: ref }).finally(() => {
      localStorage.removeItem('pending_ref');
    });
  }, [user?.email]);

  useEffect(() => {
    if (user && !user.onboarded) navigate('/onboarding');
    if (user?.account_type === 'organization') navigate('/org');
  }, [user, navigate]);

  // rootPaths for back-button: /home counts as root


  return (
    <div>
      {/* Hero */}
      <InfiniteGrid>
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-16 pb-12 md:pb-24 relative">
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
            {/* Left: text */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('home.badge')}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight text-balance mb-5"
                style={{ textShadow: '0 0 50px hsl(var(--foreground) / 0.2)' }}
              >
                {t('home.hero1')}<br />{t('home.hero2')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-base md:text-lg text-muted-foreground max-w-md mb-8 leading-relaxed"
              >
                {t('home.desc')}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap gap-3 mb-4"
              >
                <Button size="lg" onClick={() => navigate('/catalog')} className="rounded-full h-12 px-7 text-base font-semibold">
                  {t('home.btn1')}
                </Button>
                <Button size="lg" onClick={() => navigate('/assistant')} className="rounded-full h-12 px-7 text-base font-semibold bg-foreground text-background hover:bg-foreground/90">
                  {t('home.btn2')}
                </Button>
              </motion.div>
            </div>

            {/* Right: live event feed */}
            <HeroEventFeed events={events} navigate={navigate} />
          </div>
        </div>
      </section>
      </InfiniteGrid>

      {/* Platform stats */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-2">
        <div className="grid grid-cols-3 gap-3 md:gap-5">
          {[
            { key: 'users', label: t('home.statsUsers'), value: stats.users },
            { key: 'orgs', label: t('home.statsOrgs'), value: stats.orgs },
            { key: 'events', label: t('home.statsEvents'), value: stats.events },
          ].map((s) => (
            <div
              key={s.key}
              className="rounded-2xl border border-border bg-card px-4 py-5 md:px-6 md:py-6 text-center md:text-left"
            >
              <div className="font-display text-3xl md:text-5xl font-semibold tabular-nums leading-none">
                {s.value === null ? '—' : s.value.toLocaleString('ru-RU')}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Organizations marquee */}
      <OrgMarquee label={t('home.orgs')} />

      {/* Ambassador / Partner */}
      <AmbassadorBanner />

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold">{t('home.categories')}</h2>
            <p className="text-muted-foreground mt-2">{t('home.categoriesDesc')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CATEGORIES.map((c, i) => (
            <motion.button
              key={c.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/catalog?category=${c.value}`)}
              className="group p-5 rounded-2xl border border-border hover:border-foreground/30 bg-card text-left transition-all hover:-translate-y-0.5"
            >
              <div className="font-medium text-sm mb-1">{c.label}</div>
              <div className="text-xs text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                {t('home.open')}
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Recent events */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold">{t('home.recent')}</h2>
            <p className="text-muted-foreground mt-2">{t('home.recentDesc')}</p>
          </div>
          <Link to="/catalog" className="hidden md:inline-flex items-center gap-1 text-sm font-medium hover:underline">
            {t('home.allEvents')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[16/10] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground">{t('home.noEvents')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-16">
          <div className="max-w-2xl relative z-10">
            <h2 className="font-display text-3xl md:text-5xl font-semibold leading-tight text-balance mb-4">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-primary-foreground/70 mb-8 text-lg">
              {t('home.ctaDesc')}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/catalog')}
              className="rounded-full h-12 px-6 gap-2"
            >
              {t('home.ctaBtn')} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-foreground/5 blur-3xl" />
        </div>
      </section>
    </div>
  );
}