import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BadgeCheck, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

// Minimal, self-contained embed view (no Layout, no auth required).
// Designed to be embedded via <iframe>.
export default function OrgEmbed() {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const bySlug = await base44.entities.Organization.filter({ slug }).catch(() => []);
      let o = bySlug[0];
      if (!o) {
        const byId = await base44.entities.Organization.filter({ id: slug }).catch(() => []);
        o = byId[0];
      }
      if (o) {
        const evs = await base44.entities.Event
          .filter({ organization_id: o.id }, '-created_at', 12)
          .catch(() => []);
        setOrg(o);
        setEvents(evs);
      }
      setLoading(false);
    })();
  }, [slug]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  if (loading) {
    return <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#666' }}>Loading…</div>;
  }
  if (!org) {
    return <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#666' }}>Organization not found</div>;
  }

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      color: '#0a0a0a',
      background: '#fff',
      padding: '20px',
      maxWidth: '100%',
      lineHeight: 1.5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {org.logo_url ? (
          <img src={org.logo_url} alt={org.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f1f1f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#888' }}>
            {org.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 700 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</span>
            {org.verified && <BadgeCheck size={18} color="#2563eb" aria-label="Verified" />}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>{events.length} events on Op Finder</div>
        </div>
        <a
          href={`${origin}/o/${org.slug || org.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12, padding: '6px 12px', borderRadius: 999,
            border: '1px solid #e5e5e5', color: '#0a0a0a', textDecoration: 'none',
          }}
        >
          View on Op Finder →
        </a>
      </div>

      {events.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#888', border: '1px dashed #e5e5e5', borderRadius: 12 }}>
          No events published yet
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 }}>
          {events.map(e => (
            <a
              key={e.id}
              href={`${origin}/event/${e.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textDecoration: 'none', color: '#0a0a0a',
                border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden',
                background: '#fff',
              }}
            >
              {e.cover_url && (
                <div style={{ aspectRatio: '16/10', overflow: 'hidden' }}>
                  <img src={e.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {e.title}
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#666' }}>
                  {e.application_deadline && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> until {format(new Date(e.application_deadline), 'd MMM yyyy')}
                    </span>
                  )}
                  {e.city && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {e.city}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: '#999', textAlign: 'right' }}>
        Powered by{' '}
        <a href={origin} target="_blank" rel="noopener noreferrer" style={{ color: '#0a0a0a', textDecoration: 'underline' }}>
          Op Finder
        </a>
      </div>
    </div>
  );
}
