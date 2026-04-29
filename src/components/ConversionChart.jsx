import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ConversionChart({ events, apps }) {
  const data = events
    .filter(e => (e.views_count || 0) > 0 || apps.filter(a => a.event_id === e.id).length > 0)
    .map(e => {
      const views = e.views_count || 0;
      const applied = apps.filter(a => a.event_id === e.id).length;
      const rate = views > 0 ? Math.round((applied / views) * 100) : 0;
      return {
        name: e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title,
        views,
        applied,
        rate,
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        Данных для графика пока нет — опубликуйте события и дождитесь просмотров
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-card border border-border rounded-xl p-3 text-sm shadow-lg">
        <div className="font-medium mb-1.5 max-w-[180px] break-words">{label}</div>
        <div className="text-muted-foreground">Просмотров: <span className="text-foreground font-medium">{d.views}</span></div>
        <div className="text-muted-foreground">Заявок: <span className="text-foreground font-medium">{d.applied}</span></div>
        <div className="text-muted-foreground">Конверсия: <span className="font-semibold text-foreground">{d.rate}%</span></div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4} barCategoryGap="30%">
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))' }} />
          <Bar dataKey="views" name="Просмотры" radius={[6, 6, 0, 0]} fill="hsl(var(--muted-foreground))" opacity={0.4} />
          <Bar dataKey="applied" name="Заявки" radius={[6, 6, 0, 0]} fill="hsl(var(--foreground))" />
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left pb-2 font-medium">Событие</th>
              <th className="text-right pb-2 font-medium">Просм.</th>
              <th className="text-right pb-2 font-medium">Заявок</th>
              <th className="text-right pb-2 font-medium">Конверсия</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 pr-4 max-w-[200px] truncate">{d.name}</td>
                <td className="py-2.5 text-right text-muted-foreground">{d.views}</td>
                <td className="py-2.5 text-right">{d.applied}</td>
                <td className="py-2.5 text-right">
                  <span className={`font-semibold ${d.rate >= 10 ? 'text-green-600' : d.rate >= 3 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {d.rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}