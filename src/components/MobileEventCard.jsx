import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { getCategory, daysUntil } from '@/lib/categories';
import { cn } from '@/lib/utils';
import BookmarkButton from '@/components/BookmarkButton';
import { useI18n } from '@/lib/i18n';

/**
 * Mobile-only event card.
 * Design based on op_finder_mobile_bw.html mockup:
 *  - surface background, no heavy imagery
 *  - tag row (first = dark-tag), bookmark icon top-right
 *  - title 13px bold, org subtext 11px muted
 *  - bottom row: date (red when <=7d) + black "Подать" pill
 */
export default function MobileEventCard({ event }) {
  const { lang } = useI18n();
  const cat = getCategory(event.category, event.category_custom, lang);
  const days = daysUntil(event.application_deadline);
  const soon = days !== null && days >= 0 && days <= 7;
  const past = days !== null && days < 0;

  const secondaryTags = [];
  if (event.format === 'online') {
    secondaryTags.push(lang === 'en' ? 'Online' : 'Онлайн');
  }
  if (event.city) secondaryTags.push(event.city);

  const dateText = () => {
    if (!event.application_deadline) return '';
    if (past) return lang === 'en' ? 'Ended' : 'Завершено';
    if (days === 0) return lang === 'en' ? 'Today' : 'Сегодня';
    if (days === 1) return lang === 'en' ? 'Tomorrow' : 'Завтра';
    if (days <= 7) return lang === 'en' ? `${days}d left` : `Осталось ${days} дн.`;
    return format(new Date(event.application_deadline), 'd MMM yyyy', { locale: lang === 'en' ? enUS : ru });
  };

  return (
    <Link
      to={`/event/${event.id}`}
      className="block rounded-[14px] bg-secondary p-4 active:opacity-80 transition"
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          <span className="px-2 py-[2px] rounded-full bg-foreground text-background text-[10px] font-semibold uppercase tracking-wider">
            {cat.label}
          </span>
          {secondaryTags.slice(0, 2).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-[2px] rounded-full border border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="shrink-0 -mr-1">
          <BookmarkButton event={event} />
        </div>
      </div>

      <h3 className="text-[13px] font-semibold leading-snug tracking-tight text-foreground line-clamp-2 mb-1">
        {event.title}
      </h3>
      {event.organization_name && (
        <div className="text-[11px] text-muted-foreground/80 mb-3 truncate">
          {event.organization_name}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className={cn(
          "text-[11px]",
          past ? "text-muted-foreground/70 line-through" :
          soon ? "text-[#c0392b] font-semibold" : "text-muted-foreground"
        )}>
          {dateText()}
        </div>
        <span className="text-[11px] font-semibold tracking-tight px-3.5 py-[6px] rounded-full bg-foreground text-background">
          {lang === 'en' ? 'Apply' : 'Подать'}
        </span>
      </div>
    </Link>
  );
}
