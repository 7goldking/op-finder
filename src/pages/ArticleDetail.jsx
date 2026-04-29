import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Clock, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useTranslate } from '@/hooks/useTranslate';
import { Loader2 } from 'lucide-react';

const CAT_LABELS = {
  career: 'Карьера', education: 'Обучение', hackathons: 'Хакатоны',
  internships: 'Стажировки', soft_skills: 'Soft skills', tech: 'Технологии', other: 'Разное',
};

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Article.filter({ id }).then(list => {
      const a = list[0];
      setArticle(a);
      setLoading(false);
      if (a) base44.entities.Article.update(a.id, { views_count: (a.views_count || 0) + 1 }).catch(() => {});
    });
  }, [id]);

  const { translated: tx, translating } = useTranslate(article ? {
    title: article.title,
    excerpt: article.excerpt || '',
    content: article.content || '',
  } : {});

  if (loading) return <div className="py-16 text-center text-muted-foreground">Загрузка...</div>;
  if (!article) return <div className="py-16 text-center text-muted-foreground">Статья не найдена</div>;

  const isOwner = user && (user.email === article.author_email || user.role === 'admin');

  const remove = async () => {
    if (!confirm('Удалить статью?')) return;
    await base44.entities.Article.delete(article.id);
    toast.success('Удалено');
    navigate('/blog');
  };

  return (
    <article className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
        {CAT_LABELS[article.category] || 'Статья'}
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-5 flex items-start gap-3">
        {tx.title || article.title}
        {translating && <Loader2 className="w-5 h-5 mt-2 animate-spin text-muted-foreground shrink-0" />}
      </h1>

      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-sm font-semibold">
            {article.author_avatar_url ? (
              <img src={article.author_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (article.author_name || '?')[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="text-sm font-medium">{article.author_name || 'Автор'}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{format(new Date(article.created_date), 'd MMMM yyyy', { locale: ru })}</span>
              {article.read_time_min > 0 && (
                <><span>·</span><span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {article.read_time_min} мин</span></>
              )}
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Link to={`/blog/${article.id}/edit`}>
              <Button variant="outline" size="sm" className="rounded-full gap-1.5"><Pencil className="w-3.5 h-3.5" /> Править</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={remove} className="rounded-full gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5" /> Удалить
            </Button>
          </div>
        )}
      </div>

      {article.cover_url && (
        <div className="rounded-2xl overflow-hidden mb-8 aspect-[16/9] bg-muted">
          <img src={article.cover_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="prose prose-neutral dark:prose-invert max-w-none font-sans text-foreground/90 leading-relaxed">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h2 className="font-display text-2xl font-semibold mt-8 mb-3">{children}</h2>,
            h2: ({ children }) => <h2 className="font-display text-2xl font-semibold mt-8 mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="font-display text-xl font-semibold mt-6 mb-2">{children}</h3>,
            p: ({ children }) => <p className="my-4 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="my-4 ml-6 list-disc space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="my-4 ml-6 list-decimal space-y-1">{children}</ol>,
            a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{children}</a>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-4 italic my-4 text-muted-foreground">{children}</blockquote>,
          }}
        >
          {tx.content || article.content}
        </ReactMarkdown>
      </div>

      {(article.tags || []).length > 0 && (
        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-2">
          {article.tags.map(t => <span key={t} className="px-3 py-1 rounded-full bg-secondary text-sm">#{t}</span>)}
        </div>
      )}
    </article>
  );
}