import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { getCategory, daysUntil, getFormats } from '@/lib/categories';
import { cn } from '@/lib/utils';
import BookmarkButton from '@/components/BookmarkButton';
import MobileEventCard from '@/components/MobileEventCard';
import { useI18n } from '@/lib/i18n';

export default function EventCard({ event, index = 0 }) {
  const { lang, t } = useI18n();
  const cat = getCategory(event.category, event.category_custom, lang);
  const days = daysUntil(event.application_deadline);
  const soon = days !== null && days >= 0 && days <= 7;
  const past = days !== null && days < 0;

  return (
    <>
    {/* Mobile-only card — matches B&W mockup. Desktop version below (md:block). */}
    <div className="md:hidden">
      <MobileEventCard event={event} />
    </div>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="hidden md:block"
    >
      <Link to={`/event/${event.id}`} className="group block">
        <article className="relative bg-card border border-border rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] transition-all duration-300">
          <div className={cn(
            "relative overflow-hidden",
            event.cover_url
              ? "aspect-[16/9] sm:aspect-[16/10] bg-muted"
              : "h-14 sm:h-16 bg-secondary"
          )}>
            {event.cover_url && (
              <img
                src={event.cover_url}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            )}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-background/95 backdrop-blur text-[11px] font-medium uppercase tracking-wider">
                {cat.label}
              </span>
              {event.discovery_source === 'ai-agent' && (
                <span
                  className="px-2 py-1 rounded-full bg-violet-500/95 text-white backdrop-blur text-[10px] font-semibold tracking-wider flex items-center gap-1"
                  title={lang === 'en' ? 'Auto-discovered by AI' : 'Найдено AI-агентом'}
                >
                  🤖 AI
                </span>
              )}
            </div>
            <div className="absolute top-3 right-14">
              <BookmarkButton event={event} />
            </div>
            {event.format && (
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground backdrop-blur text-[11px] font-medium">
                {getFormats(lang).find(f => f.value === event.format)?.label || event.format}
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <span className="truncate">{event.organization_name}</span>
              {event.organization_verified && <VerifiedBadge size="sm" />}
            </div>

            <h3 className="font-display text-base sm:text-lg font-semibold leading-snug text-balance mb-3 line-clamp-2 group-hover:underline underline-offset-4 decoration-1">
              {event.title}
            </h3>

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{event.city || (event.format === 'online' ? (lang === 'en' ? 'Everywhere' : 'Везде') : '—')}</span>
              </div>
              {event.application_deadline && (
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-medium",
                  past ? "text-muted-foreground line-through" :
                  soon ? "text-warning" : "text-foreground"
                )}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {past ? (lang === 'en' ? 'Ended' : 'Завершено') :
                     days === 0 ? (lang === 'en' ? 'Today' : 'Сегодня') :
                     days === 1 ? (lang === 'en' ? 'Tomorrow' : 'Завтра') :
                     days <= 7 ? (lang === 'en' ? `In ${days}d.` : `Через ${days} дн.`) :
                     format(new Date(event.application_deadline), 'd MMM', { locale: lang === 'en' ? enUS : ru })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
    </>
  );
}