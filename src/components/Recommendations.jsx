import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Sparkles, ArrowRight, GraduationCap, BookOpen, Compass } from 'lucide-react';
import MentorCard from '@/components/MentorCard';
import ArticleCard from '@/components/ArticleCard';
import EventCard from '@/components/EventCard';
import { buildUserKeywords, scoreMentor, scoreArticle, scoreEvent, topBy } from '@/lib/recommend';

export default function Recommendations({ user }) {
  const [mentors, setMentors] = useState([]);
  const [articles, setArticles] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [m, a, e] = await Promise.all([
          base44.entities.Mentor.filter({ accepting_requests: true }, '-created_date', 60),
          base44.entities.Article.filter({ status: 'published' }, '-created_date', 60),
          base44.entities.Event.filter({ status: 'published' }, '-created_date', 60),
        ]);
        setMentors(m);
        setArticles(a);
        setEvents(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const userKw = useMemo(() => buildUserKeywords(user), [user]);

  const recMentors = useMemo(() => topBy(mentors, scoreMentor, userKw, 3), [mentors, userKw]);
  const recArticles = useMemo(() => topBy(articles, scoreArticle, userKw, 3), [articles, userKw]);
  const recEvents = useMemo(() => topBy(events, scoreEvent, userKw, 3), [events, userKw]);

  const hasProfile = user && ((user.interests?.length || 0) + (user.skills?.length || 0) + (user.goals ? 1 : 0) + (user.search_history?.length || 0)) > 0;

  if (loading) return null;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <h2 className="font-display text-2xl md:text-3xl font-semibold">Рекомендации для тебя</h2>
        </div>
        {!hasProfile && (
          <Link to="/profile" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
            Заполни интересы для точных рекомендаций
          </Link>
        )}
      </div>

      {recEvents.length > 0 && (
        <Section title="События" icon={Compass} link="/catalog" linkLabel="Все события">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recEvents.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
          </div>
        </Section>
      )}

      {recMentors.length > 0 && (
        <Section title="Менторы" icon={GraduationCap} link="/mentors" linkLabel="Все менторы">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recMentors.map(m => <MentorCard key={m.id} mentor={m} />)}
          </div>
        </Section>
      )}

      {recArticles.length > 0 && (
        <Section title="Статьи" icon={BookOpen} link="/blog" linkLabel="Весь блог">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recArticles.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children, link, linkLabel }) {
  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-display text-xl font-semibold">{title}</h3>
        </div>
        {link && (
          <Link to={link} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}