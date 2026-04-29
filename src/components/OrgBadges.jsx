import React from 'react';
import { Trophy, ShieldCheck, Sparkles } from 'lucide-react';

const ORG_BADGES = [
  { key: 'verified',   icon: '✅', label: 'Верифицирована',   desc: 'Подтверждённая организация' },
  { key: 'first_event',icon: '🎯', label: 'Первое событие',   desc: 'Опубликовано первое событие', threshold: 1, type: 'events' },
  { key: 'active',     icon: '⚡', label: 'Активный организатор', desc: '5+ событий', threshold: 5, type: 'events' },
  { key: 'popular',    icon: '🔥', label: 'Популярные события',  desc: '50+ заявок суммарно', threshold: 50, type: 'apps' },
  { key: 'community',  icon: '🌟', label: 'Сообщество',          desc: '200+ заявок суммарно', threshold: 200, type: 'apps' },
  { key: 'legend',     icon: '👑', label: 'Легенда',              desc: '10+ событий и 500+ заявок', threshold: 10, type: 'legend' },
];

export default function OrgBadges({ user, org, events = [], applicationsCount = 0 }) {
  const eventsCount = events.length;
  const appsCount = applicationsCount;

  const isUnlocked = (b) => {
    if (b.key === 'verified') return !!org?.verified;
    if (b.type === 'events') return eventsCount >= b.threshold;
    if (b.type === 'apps') return appsCount >= b.threshold;
    if (b.type === 'legend') return eventsCount >= 10 && appsCount >= 500;
    return false;
  };

  const unlocked = ORG_BADGES.filter(isUnlocked);
  const locked = ORG_BADGES.filter(b => !isUnlocked(b));

  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">Достижения организации</h3>
          <p className="text-xs text-muted-foreground">{unlocked.length} из {ORG_BADGES.length} открыто</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-secondary">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> События</div>
          <div className="font-display text-3xl font-semibold mt-1">{eventsCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-secondary">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Заявок собрано</div>
          <div className="font-display text-3xl font-semibold mt-1">{appsCount}</div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-3">Все бейджи</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ORG_BADGES.map(b => {
            const ok = isUnlocked(b);
            return (
              <div
                key={b.key}
                className={`p-3 rounded-xl flex items-start gap-3 transition-colors ${ok ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                <div className={`text-xl leading-none ${ok ? '' : 'grayscale opacity-50'}`}>{b.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${ok ? '' : 'text-foreground/70'}`}>{b.label}</div>
                  <div className="text-[11px] opacity-80 leading-tight mt-0.5">{b.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}