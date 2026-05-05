import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Bookmark,
  FileText,
  Bell,
  Sun,
  Globe,
  LogOut,
  Sparkles,
  Trophy,
  Briefcase,
  Heart,
} from 'lucide-react';
import { auth } from '@/api/auth';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';

/**
 * Mobile-only profile / hub screen, faithful to op_finder_mobile_bw.html mockup.
 * Renders ONLY on mobile (<md). Desktop /dashboard untouched.
 */
export default function MobileProfile({ user }) {
  const { t, lang } = useI18n();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ apps: 0, bookmarks: 0, achievements: 0 });

  useEffect(() => {
    if (!user) return;
    let alive = true;
    Promise.all([
      base44.entities.Application.list('-created_date', 100).catch(() => []),
      base44.entities.Bookmark.list('-created_date', 200).catch(() => []),
    ]).then(([apps, bms]) => {
      if (!alive) return;
      const accepted = apps.filter((a) => a.status === 'accepted').length;
      setStats({
        apps: apps.length,
        bookmarks: bms.length,
        achievements: accepted,
      });
    });
    return () => { alive = false; };
  }, [user]);

  if (!user) {
    return (
      <div className="px-5 pt-6 pb-32 text-center">
        <div className="text-[14px] text-muted-foreground mb-4">
          {lang === 'en' ? 'Sign in to see your profile' : 'Войди, чтобы увидеть профиль'}
        </div>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-5 py-3 rounded-[10px] bg-foreground text-background text-[14px] font-bold"
        >
          {lang === 'en' ? 'Sign in' : 'Войти'}
        </Link>
      </div>
    );
  }

  const initials = (user.full_name || user.email || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

  const langs = [];
  if (lang) langs.push(lang.toUpperCase());
  if (user.bio_languages) {
    user.bio_languages.split(',').slice(0, 3).forEach((l) => {
      const v = l.trim().toUpperCase();
      if (v && !langs.includes(v)) langs.push(v);
    });
  }
  while (langs.length < 3) langs.push(['RU', 'EN', 'KZ'][langs.length]);

  const acceptedApps = Math.min(stats.apps, stats.achievements);
  const subtitle = [
    user.role || (lang === 'en' ? 'Student' : 'Студент'),
    user.city,
  ].filter(Boolean).join(' · ');

  return (
    <div className="pb-28">
      {/* Top section — avatar + name + lang badges + stats */}
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center gap-[14px] mb-4">
          <div className="w-[60px] h-[60px] rounded-full bg-foreground flex items-center justify-center shrink-0 overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[20px] font-bold text-background tracking-tight">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[17px] font-bold tracking-tight truncate">
              {user.full_name || user.email}
            </div>
            {subtitle && (
              <div className="text-[12px] text-muted-foreground/80 mt-0.5 truncate">{subtitle}</div>
            )}
            <div className="flex gap-[5px] mt-1.5">
              {langs.slice(0, 3).map((l) => (
                <span
                  key={l}
                  className="text-[10px] font-semibold px-[7px] py-[2px] rounded-[4px] bg-muted text-muted-foreground tracking-wider"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats grid 3-up with hairline borders */}
        <div className="grid grid-cols-3 gap-[1px] bg-border rounded-[10px] overflow-hidden">
          {[
            { n: stats.apps, l: lang === 'en' ? 'Applied' : 'Заявок' },
            { n: stats.bookmarks, l: lang === 'en' ? 'Saved' : 'Сохранено' },
            { n: stats.achievements, l: lang === 'en' ? 'Wins' : 'Достижений' },
          ].map((s) => (
            <div key={s.l} className="bg-secondary py-3 text-center">
              <div className="text-[17px] font-bold tracking-tight tabular-nums">{s.n}</div>
              <div className="text-[10px] font-medium text-muted-foreground/80 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Account section */}
      <Section label={lang === 'en' ? 'Account' : 'Аккаунт'}>
        <Row
          icon={<UserIcon className="w-4 h-4" />}
          title={lang === 'en' ? 'Interests & goals' : 'Интересы и цели'}
          subtitle={(user.interests?.slice(0, 3) || []).join(', ') || (lang === 'en' ? 'Add interests' : 'Добавь интересы')}
          to="/profile"
        />
        <Row
          icon={<FileText className="w-4 h-4" />}
          title={lang === 'en' ? 'My applications' : 'Мои заявки'}
          subtitle={
            lang === 'en'
              ? `${stats.apps} sent, ${acceptedApps} accepted`
              : `${stats.apps} подано, ${acceptedApps} одобрено`
          }
          to="/dashboard"
        />
        <Row
          icon={<Bookmark className="w-4 h-4" />}
          title={lang === 'en' ? 'Saved opportunities' : 'Сохранённое'}
          subtitle={
            lang === 'en'
              ? `${stats.bookmarks} saved`
              : `${stats.bookmarks} закладок`
          }
          to="/dashboard?tab=saved"
        />
        <Row
          icon={<Trophy className="w-4 h-4" />}
          title={lang === 'en' ? 'Achievements' : 'Достижения'}
          subtitle={lang === 'en' ? 'Awarded events' : 'Принятые заявки'}
          to="/achievements"
        />
        <Row
          icon={<Sparkles className="w-4 h-4" />}
          title={lang === 'en' ? 'Submit opportunity' : 'Предложить возможность'}
          subtitle={lang === 'en' ? "Share what you've found" : 'Поделись находкой'}
          to="/submit"
        />
      </Section>

      {/* Settings section */}
      <Section label={lang === 'en' ? 'Settings' : 'Настройки'}>
        <Row
          icon={<Bell className="w-4 h-4" />}
          title={lang === 'en' ? 'Notifications' : 'Уведомления'}
          subtitle={lang === 'en' ? 'Deadlines, new events' : 'Дедлайны, новые события'}
          to="/profile#notifications"
        />
        <Row
          icon={<Sun className="w-4 h-4" />}
          title={lang === 'en' ? 'Theme' : 'Тема'}
          subtitle={isDark ? (lang === 'en' ? 'Dark' : 'Тёмная') : (lang === 'en' ? 'Light' : 'Светлая')}
          onClick={toggleTheme}
        />
        <Row
          icon={<Globe className="w-4 h-4" />}
          title={lang === 'en' ? 'Language' : 'Язык'}
          subtitle={lang === 'ru' ? 'Русский' : lang === 'kz' ? 'Қазақ' : 'English'}
          to="/profile#language"
        />
        {user.account_type === 'organization' && (
          <Row
            icon={<Briefcase className="w-4 h-4" />}
            title={lang === 'en' ? 'Organization' : 'Организация'}
            subtitle={lang === 'en' ? 'Brand page, events' : 'Страница, события'}
            to="/org"
          />
        )}
      </Section>

      {/* Sign out */}
      <div className="px-5 pt-4">
        <button
          onClick={() => auth.logout().then(() => navigate('/login')).catch(() => navigate('/login'))}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] border border-border text-[13px] font-semibold text-muted-foreground active:bg-secondary"
        >
          <LogOut className="w-4 h-4" />
          {lang === 'en' ? 'Sign out' : 'Выйти'}
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="px-5 pt-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/80 mb-2">
        {label}
      </div>
      <div className="space-y-[7px]">{children}</div>
    </div>
  );
}

function Row({ icon, title, subtitle, to, onClick }) {
  const inner = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-[30px] h-[30px] rounded-[7px] bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-foreground truncate">{title}</div>
          {subtitle && (
            <div className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">{subtitle}</div>
          )}
        </div>
      </div>
      <span className="text-muted-foreground/80 text-[14px]">›</span>
    </>
  );
  const className =
    'w-full flex items-center justify-between px-3.5 py-3 rounded-[10px] bg-secondary active:opacity-80';
  return onClick ? (
    <button onClick={onClick} className={className}>{inner}</button>
  ) : (
    <Link to={to} className={className}>{inner}</Link>
  );
}
