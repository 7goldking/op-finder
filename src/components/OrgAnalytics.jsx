import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function OrgAnalytics({ apps, events }) {
  // Applications over last 30 days
  const timelineData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, 'd MMM', { locale: ru });
      const count = apps.filter(a => {
        const d = startOfDay(new Date(a.submitted_at || a.created_date));
        return d.getTime() === day.getTime();
      }).length;
      days.push({ day: dayStr, заявки: count });
    }
    return days;
  }, [apps]);

  // Status funnel
  const funnelData = useMemo(() => [
    { name: 'Подано', value: apps.filter(a => ['submitted', 'in_review', 'accepted', 'rejected'].includes(a.status)).length },
    { name: 'На проверке', value: apps.filter(a => a.status === 'in_review').length },
    { name: 'Принято', value: apps.filter(a => a.status === 'accepted').length },
  ], [apps]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const cats = {};
    events.forEach(e => {
      const k = e.category || 'other';
      cats[k] = (cats[k] || 0) + 1;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [events]);

  // City breakdown
  const cityData = useMemo(() => {
    const cities = {};
    apps.forEach(a => {
      if (a.user_city) cities[a.user_city] = (cities[a.user_city] || 0) + 1;
    });
    return Object.entries(cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [apps]);

  // Trend: compare last 7 vs previous 7 days
  const last7 = apps.filter(a => new Date(a.created_date) >= subDays(new Date(), 7)).length;
  const prev7 = apps.filter(a => {
    const d = new Date(a.created_date);
    return d >= subDays(new Date(), 14) && d < subDays(new Date(), 7);
  }).length;
  const trend = last7 - prev7;

  const PIE_COLORS = ['hsl(var(--foreground))', 'hsl(var(--muted-foreground))', 'hsl(var(--border))'];

  if (apps.length === 0) return null;

  return (
    <div className="space-y-6 mb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Расширенная аналитика</h2>
          <p className="text-sm text-muted-foreground">Динамика и воронка конверсии</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full ${trend > 0 ? 'bg-success/10 text-success' : trend < 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
          {trend > 0 ? <TrendingUp className="w-4 h-4" /> : trend < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          {trend > 0 ? '+' : ''}{trend} заявок за 7 дней
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6 rounded-2xl border border-border bg-card">
        <div className="text-sm font-medium mb-4">Заявки за последние 30 дней</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="заявки" stroke="hsl(var(--foreground))" strokeWidth={2} fill="url(#areaGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="p-6 rounded-2xl border border-border bg-card">
          <div className="text-sm font-medium mb-4">Воронка конверсии</div>
          <div className="space-y-3">
            {funnelData.map((item, i) => {
              const pct = funnelData[0].value > 0 ? Math.round((item.value / funnelData[0].value) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.value} <span className="text-muted-foreground">({pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all"
                      style={{ width: `${pct}%`, opacity: 1 - i * 0.25 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {funnelData[0].value > 0 && (
            <div className="mt-4 text-xs text-muted-foreground">
              Конверсия: {Math.round((funnelData[2].value / funnelData[0].value) * 100)}% заявок принято
            </div>
          )}
        </div>

        {/* Cities */}
        {cityData.length > 0 && (
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="text-sm font-medium mb-4">Топ городов</div>
            <div className="space-y-2">
              {cityData.map(c => {
                const pct = apps.length > 0 ? Math.round((c.value / apps.length) * 100) : 0;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 truncate">{c.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-foreground rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{c.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}