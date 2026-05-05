import { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import PullToRefresh from '@/components/PullToRefresh';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Bookmark, FileText, Award, TrendingUp, Sparkles, ArrowRight, Trophy, Users, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCategory, daysUntil } from '@/lib/categories';
import { motion } from 'framer-motion';
import FriendsCard from '@/components/FriendsCard';
import Recommendations from '@/components/Recommendations';
import MobileProfile from '@/components/MobileProfile';
import { useI18n } from '@/lib/i18n';

export default function Dashboard() {
  const { user } = useOutletContext() || {};
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [apps, setApps] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [tab, setTab] = useState('active');

  const fetchData = useCallback(() => {
    return Promise.all([
      base44.entities.Application.list('-created_date', 50),
      base44.entities.Bookmark.list('-created_date', 50),
    ]).then(([a, b]) => { setApps(a); setBookmarks(b); });
  }, []);

  useEffect(() => { fetchData(); }, []);

  const activeApps = apps.filter(a => ['submitted', 'in_review'].includes(a.status));
  const acceptedApps = apps.filter(a => a.status === 'accepted');
  const rejectedApps = apps.filter(a => a.status === 'rejected');

  const displayApps =
    tab === 'active' ? activeApps :
    tab === 'accepted' ? acceptedApps :
    tab === 'rejected' ? rejectedApps : apps;

  const dateLocale = lang === 'en' ? enUS : ru;

  return (
    <>
    {/* Mobile-only profile hub (matches op_finder_mobile_bw.html mockup). Desktop below unchanged. */}
    <div className="md:hidden">
      <MobileProfile user={user} />
    </div>
    <PullToRefresh onRefresh={fetchData}>
    <div className="hidden md:block max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground mb-2">{t('dashboard.kicker')}</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold">
            {t('dashboard.greeting')} {user?.full_name?.split(' ')[0] || t('dashboard.friend')}
          </h1>
        </div>
        <Link to="/profile" className="px-4 py-2 rounded-full border border-border hover:border-foreground/30 text-sm font-medium">
          {t('dashboard.profile')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Stat icon={FileText} value={apps.length} label={t('dashboard.total')} />
        <Stat icon={TrendingUp} value={activeApps.length} label={t('dashboard.active')} />
        <Stat icon={Award} value={acceptedApps.length} label={t('dashboard.accepted')} accent />
        <Stat icon={Bookmark} value={bookmarks.length} label={t('dashboard.bookmarks')} />
      </div>

      {/* Quick links: Teams & Achievements */}
      {user?.account_type !== 'organization' && (
        <div className="grid grid-cols-2 gap-3 mb-10">
          <Link to="/teams" className="p-5 rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">{t('dashboard.teams')}</div>
              <div className="text-xs text-muted-foreground">{t('dashboard.teams_desc')}</div>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/achievements" className="p-5 rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">{t('dashboard.achievements_link')}</div>
              <div className="text-xs text-muted-foreground">{t('dashboard.achievements_desc')}</div>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {/* Portfolio teaser */}
      {acceptedApps.length > 0 && (
        <Link to="/portfolio" className="block mb-10 group">
          <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-70 mb-1">{t('dashboard.portfolio_kicker')}</div>
                <h3 className="font-display text-2xl md:text-3xl font-semibold">
                  {acceptedApps.length} {acceptedApps.length === 1 ? t('dashboard.achievement') : t('dashboard.achievements')}
                </h3>
                <p className="text-primary-foreground/70 mt-1 text-sm">{t('dashboard.portfolio_link')}</p>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      )}

      {/* Apps tabs */}
      <div className="mb-6 fade-right-edge md:[&::after]:hidden">
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto scrollbar-hide">
        {[
          { key: 'active', label: `${t('dashboard.tab_active')} (${activeApps.length})` },
          { key: 'accepted', label: `${t('dashboard.tab_accepted')} (${acceptedApps.length})` },
          { key: 'rejected', label: `${t('dashboard.tab_rejected')} (${rejectedApps.length})` },
          { key: 'bookmarks', label: `${t('dashboard.tab_bookmarks')} (${bookmarks.length})` },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === item.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
            {tab === item.key && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
          </button>
        ))}
        </div>
      </div>

      {/* Subscription plan card */}
      {user?.subscription_active && (
        <SubscriptionCard plan={user.subscription_plan} cycle={user.subscription_cycle} />
      )}

      {/* Referral card (students only) */}
      {user?.account_type !== 'organization' && (
        <div className="mb-10">
          <FriendsCard user={user} />
        </div>
      )}

      {/* Content */}
      {tab === 'bookmarks' ? (
        <BookmarksList bookmarks={bookmarks} t={t} />
      ) : displayApps.length === 0 ? (
        <EmptyState tab={tab} onBrowse={() => navigate('/catalog')} t={t} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayApps.map(a => <ApplicationCard key={a.id} app={a} dateLocale={dateLocale} t={t} />)}
        </div>
      )}

      {/* Recommendations */}
      {user?.account_type !== 'organization' && (
        <div className="mt-14">
          <Recommendations user={user} />
        </div>
      )}
    </div>
    </PullToRefresh>
    </>
  );
}

const PLAN_LABELS = {
  pro: { label: 'Pro', icon: Zap, color: 'bg-warning/10 border-warning/30 text-warning' },
  business: { label: 'Business', icon: Crown, color: 'bg-primary/10 border-primary/30 text-primary' },
};

function SubscriptionCard({ plan, cycle }) {
  const info = PLAN_LABELS[plan] || PLAN_LABELS['pro'];
  const PlanIcon = info.icon;
  return (
    <div className={`mb-8 flex items-center gap-4 p-5 rounded-2xl border ${info.color}`}>
     <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center shrink-0">
       <PlanIcon className="w-5 h-5" />
     </div>
     <div className="flex-1">
       <div className="text-xs font-semibold uppercase tracking-wider opacity-70">{info.label}</div>
       <div className="font-display text-xl font-semibold">{info.label} ✦</div>
       {cycle && <div className="text-xs opacity-60 mt-0.5">{cycle === 'annual' ? 'Annual' : 'Monthly'}</div>}
     </div>
     <Link to="/pricing" className="text-xs font-medium underline underline-offset-4 opacity-70 hover:opacity-100">
       Manage
     </Link>
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

function ApplicationCard({ app, dateLocale, t }) {
  const cat = getCategory(app.event_category);
  return (
    <Link to={`/event/${app.event_id}`} className="block group">
      <div className="p-5 rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{cat.label}</div>
          <StatusBadge status={app.status} />
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug mb-2 line-clamp-2 group-hover:underline underline-offset-4 decoration-1">
          {app.event_title}
        </h3>
        <div className="text-sm text-muted-foreground">{app.event_organization}</div>
        {app.submitted_at && (
          <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/60">
            {t('dashboard.sent')} {format(new Date(app.submitted_at), 'd MMM yyyy', { locale: dateLocale })}
          </div>
        )}
      </div>
    </Link>
  );
}

function BookmarksList({ bookmarks, t }) {
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-2xl">
        <Bookmark className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{t('dashboard.bookmarks_empty')}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {bookmarks.map(b => {
        const cat = getCategory(b.event_category);
        const days = daysUntil(b.event_deadline);
        return (
          <Link key={b.id} to={`/event/${b.event_id}`} className="group">
            <div className="p-5 rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</div>
              <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2 mb-3">{b.event_title}</h3>
              {days !== null && (
                <div className={`text-xs font-medium ${days < 0 ? 'text-muted-foreground' : days <= 7 ? 'text-warning' : ''}`}>
                  {days < 0
                    ? t('dashboard.deadline_closed')
                    : days === 0
                    ? t('dashboard.deadline_today')
                    : `${t('dashboard.deadline_days')} ${days} ${t('dashboard.deadline_days_unit')}`}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState({ tab, onBrowse, t }) {
  const msg = tab === 'active' ? t('dashboard.empty_active') :
              tab === 'accepted' ? t('dashboard.empty_accepted') :
              t('dashboard.empty_rejected');
  return (
    <div className="text-center py-16 border border-dashed border-border rounded-2xl">
      <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
      <p className="text-muted-foreground mb-6">{msg}</p>
      <Button onClick={onBrowse} variant="outline" className="rounded-full">{t('dashboard.browse')}</Button>
    </div>
  );
}