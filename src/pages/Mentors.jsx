import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MentorCard from '@/components/MentorCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Mentors() {
  const { user } = useOutletContext() || {};
  const { t } = useI18n();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [myMentor, setMyMentor] = useState(null);

  useEffect(() => {
    (async () => {
      const list = await base44.entities.Mentor.list('-created_date', 100);
      const reviews = await base44.entities.MentorReview.list('-created_date', 500);
      const agg = {};
      for (const r of reviews) {
        if (!agg[r.mentor_id]) agg[r.mentor_id] = { sum: 0, count: 0 };
        agg[r.mentor_id].sum += r.rating || 0;
        agg[r.mentor_id].count += 1;
      }
      const enriched = list.map(m => ({
        ...m,
        rating_avg: agg[m.id] ? agg[m.id].sum / agg[m.id].count : 0,
        rating_count: agg[m.id]?.count || 0,
      }));
      setMentors(enriched);
      if (user?.email) setMyMentor(enriched.find(m => m.user_email === user.email) || null);
      setLoading(false);
    })();
  }, [user]);

  const filtered = mentors.filter(m => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [m.name, m.headline, ...(m.expertise || [])].filter(Boolean).join(' ').toLowerCase().includes(s);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-sm text-muted-foreground mb-2">{t('mentors.kicker')}</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold">{t('mentors.title')}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            {t('mentors.subtitle')}
          </p>
        </div>
        <Link to={myMentor ? `/mentors/${myMentor.id}/edit` : '/mentors/new'}>
          <Button className="rounded-full gap-2">
            <Plus className="w-4 h-4" /> {myMentor ? t('mentors.my_profile') : t('mentors.become')}
          </Button>
        </Link>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={t('mentors.search_ph')}
          className="pl-11 h-12 rounded-full bg-secondary border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t('mentors.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-6">{t('mentors.empty')}</p>
          <Link to="/mentors/new">
            <Button className="rounded-full">{t('mentors.become')}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => <MentorCard key={m.id} mentor={m} />)}
        </div>
      )}
    </div>
  );
}