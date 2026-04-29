import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { InfiniteSlider } from '@/components/ui/infinite-slider';

export default function OrgMarquee({ label }) {
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    base44.entities.Organization.list('-created_date', 50).then(setOrgs);
    const unsub = base44.entities.Organization.subscribe((event) => {
      if (event.type === 'create') setOrgs((prev) => [event.data, ...prev]);
    });
    return unsub;
  }, []);

  if (orgs.length === 0) return null;

  return (
    <section className="py-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <div
        className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
      >
        <InfiniteSlider gap={24} duration={40} durationOnHover={100}>
          {orgs.map((org) => (
            <div
              key={org.id}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-border bg-card shrink-0 hover:border-foreground/20 transition-colors cursor-default"
            >
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {org.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span className="text-sm font-medium whitespace-nowrap">{org.name}</span>
              {org.verified && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">✓</span>
              )}
            </div>
          ))}
        </InfiniteSlider>
      </div>
    </section>
  );
}