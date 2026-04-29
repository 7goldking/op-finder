import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ArticleCard from '@/components/ArticleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, BookOpen, Search, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Blog() {
  const { user } = useOutletContext() || {};
  const { t } = useI18n();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [authorType, setAuthorType] = useState('all');
  const [authorEmail, setAuthorEmail] = useState('all');
  const [q, setQ] = useState('');

  const CATEGORIES = [
    { value: 'all', label: t('blog.cat_all') },
    { value: 'career', label: t('blog.cat_career') },
    { value: 'education', label: t('blog.cat_education') },
    { value: 'hackathons', label: t('blog.cat_hackathons') },
    { value: 'internships', label: t('blog.cat_internships') },
    { value: 'soft_skills', label: t('blog.cat_soft_skills') },
    { value: 'tech', label: t('blog.cat_tech') },
  ];

  const AUTHOR_TYPES = [
    { value: 'all', label: t('blog.all_authors') },
    { value: 'expert', label: t('blog.experts') },
    { value: 'organization', label: t('blog.organizations') },
    { value: 'admin', label: t('blog.team') },
  ];

  useEffect(() => {
    base44.entities.Article.filter({ status: 'published' }, '-created_date', 200)
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  const authors = useMemo(() => {
    const map = new Map();
    articles.forEach(a => {
      if (!a.author_email) return;
      if (!map.has(a.author_email)) {
        map.set(a.author_email, {
          email: a.author_email,
          name: a.author_name || 'Автор',
          avatar_url: a.author_avatar_url || '',
          type: a.author_type,
          count: 0,
        });
      }
      map.get(a.author_email).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [articles]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return articles.filter(a => {
      if (cat !== 'all' && a.category !== cat) return false;
      if (authorType !== 'all' && a.author_type !== authorType) return false;
      if (authorEmail !== 'all' && a.author_email !== authorEmail) return false;
      if (!query) return true;
      const hay = [a.title, a.excerpt, a.content, a.author_name, ...(a.tags || [])]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(query);
    });
  }, [articles, cat, authorType, authorEmail, q]);

  const canWrite = user;
  const hasFilters = cat !== 'all' || authorType !== 'all' || authorEmail !== 'all' || q;

  const clearFilters = () => {
    setCat('all'); setAuthorType('all'); setAuthorEmail('all'); setQ('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-sm text-muted-foreground mb-2">{t('blog.kicker')}</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold">{t('blog.title')}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">{t('blog.subtitle')}</p>
        </div>
        {canWrite && (
          <Link to="/blog/new">
            <Button className="rounded-full gap-2"><Plus className="w-4 h-4" /> {t('blog.write')}</Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={t('blog.search_ph')}
          className="pl-11 pr-10 h-12 rounded-full bg-secondary border-transparent"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-background flex items-center justify-center"
            aria-label={t('blog.clear')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 -mx-4 px-4">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCat(c.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              cat === c.value ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/70'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Author type pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 -mx-4 px-4">
        {AUTHOR_TYPES.map(c => (
          <button
            key={c.value}
            onClick={() => { setAuthorType(c.value); setAuthorEmail('all'); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              authorType === c.value ? 'bg-foreground text-background border-foreground' : 'bg-background border-border hover:border-foreground/30'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Authors list */}
      {authors.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 -mx-4 px-4">
          <button
            onClick={() => setAuthorEmail('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
              authorEmail === 'all' ? 'bg-secondary border-border' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('blog.all')}
          </button>
          {authors
            .filter(a => authorType === 'all' || a.type === authorType)
            .slice(0, 20)
            .map(a => (
              <button
                key={a.email}
                onClick={() => setAuthorEmail(a.email)}
                className={`shrink-0 inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                  authorEmail === a.email ? 'bg-secondary border-border' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold overflow-hidden">
                  {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : (a.name || '?')[0].toUpperCase()}
                </span>
                <span className="truncate max-w-[120px]">{a.name}</span>
                <span className="text-muted-foreground">·{a.count}</span>
              </button>
            ))}
        </div>
      )}

      {/* Result header */}
      <div className="flex items-center justify-between mb-5 text-sm text-muted-foreground">
        <span>{t('blog.found')} {filtered.length}</span>
        {hasFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 hover:text-foreground">
            <X className="w-3.5 h-3.5" /> {t('blog.reset')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t('blog.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t('blog.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}