import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--foreground))', 'hsl(var(--muted-foreground))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--chart-5))', 'hsl(var(--chart-2))'];

const EDU_LABELS = {
  school: 'Школа',
  bachelor: 'Бакалавр',
  master: 'Магистр',
  phd: 'PhD',
  other: 'Другое',
};

function countBy(list, keyFn) {
  const map = {};
  list.forEach(x => {
    const k = keyFn(x) || '—';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function Block({ title, data, empty }) {
  if (!data.length) return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <h4 className="text-sm font-medium mb-3">{title}</h4>
      <div className="text-xs text-muted-foreground text-center py-8">{empty}</div>
    </div>
  );
  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <h4 className="text-sm font-medium mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 space-y-1">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate max-w-[160px]">{d.name}</span>
            </span>
            <span className="text-muted-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DemographicsChart({ applicants }) {
  const byCity = countBy(applicants, a => a.user_city);
  const byEducation = countBy(applicants, a => EDU_LABELS[a.user_education] || a.user_education);

  // Age buckets
  const ageBuckets = { '<18': 0, '18–22': 0, '23–27': 0, '28+': 0 };
  applicants.forEach(a => {
    const age = a.user_age;
    if (!age) return;
    if (age < 18) ageBuckets['<18']++;
    else if (age <= 22) ageBuckets['18–22']++;
    else if (age <= 27) ageBuckets['23–27']++;
    else ageBuckets['28+']++;
  });
  const byAge = Object.entries(ageBuckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Block title="По городам" data={byCity} empty="Нет данных по городам" />
      <Block title="По образованию" data={byEducation} empty="Нет данных об образовании" />
      <Block title="По возрасту" data={byAge} empty="Нет данных о возрасте" />
    </div>
  );
}