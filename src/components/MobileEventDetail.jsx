import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, ExternalLink, Sparkles, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { getCategory, daysUntil, getLevels, getFormats } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import SimilarEvents from '@/components/SimilarEvents';

/**
 * Mobile-only event detail, matches op_finder_mobile_bw.html mockup.
 * All business logic (apply, bookmark, share) comes from parent via props.
 */
export default function MobileEventDetail({
  event,
  hasApplied,
  past,
  bookmarked,
  onToggleBookmark,
  onShare,
  onApply,
  isExternal,
  externalUrl,
  tx = {},
}) {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const cat = getCategory(event.category, event.category_custom, lang);
  const LEVELS = getLevels(lang);
  const FORMATS = getFormats(lang);
  const days = daysUntil(event.application_deadline);
  const urgent = days !== null && days >= 0 && days <= 3;
  const soon = days !== null && days >= 0 && days <= 7;

  const formatLabel = FORMATS.find((f) => f.value === event.format)?.label || event.format;

  const deadlineText = () => {
    if (!event.application_deadline) return '—';
    if (past) return lang === 'en' ? 'Ended' : 'Закрыт';
    if (days === 0) return lang === 'en' ? 'Today' : 'Сегодня';
    if (days === 1) return lang === 'en' ? 'Tomorrow' : 'Завтра';
    if (days <= 30) return lang === 'en' ? `${days} days` : `${days} дн.`;
    return format(new Date(event.application_deadline), 'd MMM yyyy', {
      locale: lang === 'en' ? enUS : ru,
    });
  };

  const reqLines = (event.requirements || tx.requirements || '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="pb-28">
      {/* Top row: back + bookmark */}
      <div className="flex items-center justify-between px-5 pt-3 pb-0">
        <button
          onClick={() => navigate(-1)}
          className="text-[13px] font-medium text-muted-foreground"
        >
          ← {lang === 'en' ? 'Back' : 'Назад'}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
            aria-label="share"
          >
            <Share2 className="w-[15px] h-[15px] text-muted-foreground" />
          </button>
          <button
            onClick={onToggleBookmark}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
            aria-label="bookmark"
          >
            <Bookmark
              className={cn('w-[15px] h-[15px]', bookmarked ? 'fill-foreground text-foreground' : 'text-muted-foreground')}
            />
          </button>
        </div>
      </div>

      {/* Hero card — black accent */}
      <div className="relative mx-5 mt-3 mb-4 overflow-hidden rounded-[14px] bg-foreground p-[22px]">
        <span className="absolute -top-6 -right-6 w-[100px] h-[100px] rounded-full bg-white/5" />
        <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-background/50 mb-2.5">
          {cat.label}{event.format ? ` · ${formatLabel}` : ''}
        </div>
        <div className="text-[19px] font-bold leading-tight tracking-tight text-background mb-1.5">
          {tx.title || event.title}
        </div>
        <div className="text-[12px] text-background/60">
          {event.organization_name}{event.city ? ` · ${event.city}` : ''}
        </div>
      </div>

      {/* Info grid 2x2 */}
      <div className="grid grid-cols-2 gap-2 px-5 pb-3.5">
        <InfoBox label={lang === 'en' ? 'Deadline' : 'Дедлайн'} value={deadlineText()} urgent={urgent} />
        <InfoBox label={lang === 'en' ? 'Format' : 'Формат'} value={formatLabel || '—'} />
        <InfoBox label={lang === 'en' ? 'Location' : 'Город'} value={event.city || (event.format === 'online' ? (lang === 'en' ? 'Everywhere' : 'Везде') : '—')} />
        <InfoBox label={lang === 'en' ? 'Language' : 'Языки'} value={event.language === 'ru' ? 'Рус' : event.language === 'en' ? 'EN' : (event.language || (lang === 'en' ? 'Multi' : 'Мульти'))} />
      </div>

      {/* About */}
      {(event.short_description || event.description || tx.short_description || tx.description) && (
        <div className="px-5 pb-3.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">
            {lang === 'en' ? 'About' : 'О программе'}
          </div>
          <div className="text-[13px] leading-[1.65] text-muted-foreground whitespace-pre-wrap">
            {tx.description || event.description || tx.short_description || event.short_description}
          </div>
        </div>
      )}

      {/* Requirements */}
      {reqLines.length > 0 && (
        <div className="px-5 pb-3.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">
            {lang === 'en' ? 'Requirements' : 'Требования'}
          </div>
          <div>
            {reqLines.map((line, i) => (
              <div key={i} className="flex gap-2.5 mb-1.5">
                <div className="w-px bg-border shrink-0 mt-1 self-stretch" />
                <div className="text-[13px] text-muted-foreground leading-snug">{line}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {(event.tags || []).length > 0 && (
        <div className="px-5 pb-3.5 flex flex-wrap gap-1.5">
          {event.tags.map((tag) => (
            <span key={tag} className="px-2 py-[3px] rounded-full bg-secondary text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* AI-discovered notice */}
      {event.discovery_source === 'ai-agent' && (
        <div className="mx-5 mb-3 rounded-[10px] border border-border bg-secondary p-3 text-[11px] text-muted-foreground leading-relaxed">
          🤖 {lang === 'en' ? 'Auto-discovered — verify on original source.' : 'Найдено AI-агентом — перепроверь на оригинальной странице.'}
        </div>
      )}

      {/* Apply button (black full-width) */}
      <div className="px-5 pb-2.5">
        {hasApplied ? (
          <div className="w-full py-4 rounded-[10px] bg-secondary text-center text-[14px] font-semibold text-muted-foreground">
            {lang === 'en' ? 'Application sent' : 'Заявка отправлена'}
          </div>
        ) : past ? (
          <div className="w-full py-4 rounded-[10px] bg-secondary text-center text-[14px] font-semibold text-muted-foreground">
            {lang === 'en' ? 'Applications closed' : 'Подача закрыта'}
          </div>
        ) : isExternal && !externalUrl ? (
          <div className="w-full py-4 rounded-[10px] bg-secondary text-center text-[14px] font-semibold text-muted-foreground">
            {lang === 'en' ? 'Registration link missing' : 'Ссылка не указана'}
          </div>
        ) : isExternal ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-5 py-[15px] rounded-[10px] bg-foreground text-background active:opacity-90"
          >
            <span className="text-[14px] font-bold tracking-tight">
              {lang === 'en' ? 'Go to registration' : 'Перейти к регистрации'}
              {soon && days >= 0 && <span className="font-normal opacity-70 ml-1">· {days === 0 ? (lang === 'en' ? 'today' : 'сегодня') : `${days} ${lang === 'en' ? 'd.' : 'дн.'}`}</span>}
            </span>
            <span className="text-[18px]">→</span>
          </a>
        ) : (
          <button
            onClick={onApply}
            className="flex items-center justify-between w-full px-5 py-[15px] rounded-[10px] bg-foreground text-background active:opacity-90"
          >
            <span className="text-[14px] font-bold tracking-tight">
              {lang === 'en' ? 'Apply' : 'Подать заявку'}
            </span>
            <span className="text-[18px]">→</span>
          </button>
        )}
      </div>

      {/* Ask assistant */}
      <Link
        to="/assistant"
        state={{ prefill: `Расскажи подробнее о событии "${event.title}" и помоги решить, подходит ли оно мне.` }}
        className="mx-5 mb-4 flex items-center gap-3 px-4 py-3 rounded-[10px] bg-secondary border border-border active:opacity-80"
      >
        <div className="w-8 h-8 rounded-[7px] bg-foreground flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-background" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate">
            {lang === 'en' ? 'Ask assistant' : 'Спросить ассистента'}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {lang === 'en' ? 'Will this fit you?' : 'Подходит ли тебе?'}
          </div>
        </div>
        <span className="text-muted-foreground text-[13px]">›</span>
      </Link>

      {/* Similar events */}
      <div className="px-5">
        <SimilarEvents eventId={event.id} />
      </div>
    </div>
  );
}

function InfoBox({ label, value, urgent }) {
  return (
    <div className="bg-secondary rounded-[10px] p-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground mb-0.5">{label}</div>
      <div className={cn('text-[13px] font-semibold', urgent ? 'text-[#c0392b]' : 'text-foreground')}>{value}</div>
    </div>
  );
}
