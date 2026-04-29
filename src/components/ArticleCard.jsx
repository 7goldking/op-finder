import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const CAT_LABELS = {
  career: 'Карьера', education: 'Обучение', hackathons: 'Хакатоны',
  internships: 'Стажировки', soft_skills: 'Soft skills', tech: 'Технологии', other: 'Разное',
};

export default function ArticleCard({ article }) {
  return (
    <Link to={`/blog/${article.id}`} className="block group">
      <div className="rounded-2xl border border-border bg-card overflow-hidden h-full flex flex-col hover:border-foreground/30 transition-all hover:-translate-y-0.5">
        {article.cover_url && (
          <div className="aspect-[16/9] bg-muted overflow-hidden">
            <img src={article.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {CAT_LABELS[article.category] || 'Статья'}
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2 group-hover:underline underline-offset-4 decoration-1">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{article.excerpt}</p>
          )}
          <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold shrink-0">
                {(article.author_name || '?')[0].toUpperCase()}
              </div>
              <span className="truncate">{article.author_name || 'Автор'}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {article.read_time_min > 0 && (
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {article.read_time_min} мин</span>
              )}
              <span>{format(new Date(article.created_date), 'd MMM', { locale: ru })}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}