import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Globe, Share2, Code2, MapPin } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import EventCard from '@/components/EventCard';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

export default function OrgBrandPage() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const [org, setOrg] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // slug can be the slug column OR the uuid (legacy links)
      const bySlug = await base44.entities.Organization.filter({ slug });
      let o = bySlug[0];
      if (!o) {
        // try by id
        const byId = await base44.entities.Organization.filter({ id: slug }).catch(() => []);
        o = byId[0];
      }
      if (!o) { setLoading(false); return; }
      const evs = await base44.entities.Event
        .filter({ organization_id: o.id }, '-created_at', 200)
        .catch(() => []);
      if (cancelled) return;
      setOrg(o);
      setEvents(evs);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const orgUrl = useMemo(() => `${origin}/o/${org?.slug || org?.id || slug}`, [origin, org, slug]);
  const embedSrc = useMemo(() => `${origin}/embed/org/${org?.slug || org?.id || slug}`, [origin, org, slug]);
  const embedSnippet = useMemo(
    () => `<iframe src="${embedSrc}" style="width:100%;min-height:520px;border:0;border-radius:16px" loading="lazy" title="${org?.name || ''} \u2014 Op Finder"></iframe>`,
    [embedSrc, org],
  );

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: org?.name, url: orgUrl }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(orgUrl); toast.success(t('org.copied')); }
    catch { toast.error('Copy failed'); }
  };

  const copyEmbed = async () => {
    try { await navigator.clipboard.writeText(embedSnippet); toast.success(t('org.copied')); }
    catch { toast.error('Copy failed'); }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="h-32 bg-muted rounded-3xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <div key={i} className="aspect-[16/10] bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold mb-3">{t('org.not_found')}</h2>
        <Link to="/catalog" className="text-primary underline">{t('apply.to_catalog')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
      {/* Hero */}
      <div className="rounded-3xl border border-border bg-card p-6 md:p-10 mb-10">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover bg-secondary shrink-0"
            />
          ) : (
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-secondary flex items-center justify-center text-3xl font-bold text-muted-foreground shrink-0">
              {org.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-display text-3xl md:text-4xl font-semibold">{org.name}</h1>
              {org.verified && <VerifiedBadge size="lg" showLabel />}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {org.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {org.city}
                </span>
              )}
              <span>{events.length} {t('org.events_count')}</span>
            </div>
            {org.description && (
              <p className="text-muted-foreground mt-4 leading-relaxed max-w-2xl">{org.description}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {org.website && (
                <a href={org.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full gap-2"><Globe className="w-4 h-4" /> {t('org.website')}</Button>
                </a>
              )}
              <Button variant="outline" className="rounded-full gap-2" onClick={share}>
                <Share2 className="w-4 h-4" /> {t('org.share')}
              </Button>
              <Button variant="outline" className="rounded-full gap-2" onClick={() => setShowEmbed(s => !s)}>
                <Code2 className="w-4 h-4" /> {t('org.embed')}
              </Button>
            </div>
          </div>
        </div>

        {showEmbed && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-sm font-semibold mb-1">{t('org.embed')}</div>
            <p className="text-sm text-muted-foreground mb-3">{t('org.embed_desc')}</p>
            <pre className="bg-secondary text-foreground/90 text-xs p-4 rounded-xl overflow-x-auto"><code>{embedSnippet}</code></pre>
            <div className="mt-3 flex gap-2">
              <Button onClick={copyEmbed} className="rounded-full">{t('org.copy_link')}</Button>
              <a href={embedSrc} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-full">Preview</Button>
              </a>
            </div>
          </div>
        )}
      </div>

      <h2 className="font-display text-2xl font-semibold mb-5">{t('org.events')}</h2>
      {events.length === 0 ? (
        <div className="rounded-2xl border border-border p-10 text-center text-muted-foreground">
          {t('org.no_events')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
        </div>
      )}
    </div>
  );
}
