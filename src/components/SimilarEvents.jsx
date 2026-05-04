import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useI18n } from '@/lib/i18n';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function SimilarEvents({ eventId }) {
  const { lang, t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const { data } = await supabase.rpc('find_similar_events', {
        p_event_id: eventId,
        p_limit: 4,
      });
      setItems(data || []);
      setLoading(false);
    })();
  }, [eventId]);

  if (loading) return null;
  if (!items.length) return null;

  return (
    <div className="mt-8 pt-6 border-t">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold">
          {lang === 'en' ? 'Similar opportunities' : lang === 'kz' ? 'Ұқсас мүмкіндіктер' : 'Похожие возможности'}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/event/${item.id}`}
            className="flex items-start gap-3 p-3 rounded-xl border bg-card hover:border-foreground/30 transition-colors"
          >
            {item.cover_image_url ? (
              <img
                src={item.cover_image_url}
                alt=""
                className="w-12 h-12 rounded-lg object-cover shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-lg">
                {item.category === 'hackathon' ? '⚡' : item.category === 'grant' ? '💰' : item.category === 'scholarship' ? '🎓' : '✨'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium line-clamp-2 leading-tight">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                {item.organization_name && <span className="truncate">{item.organization_name}</span>}
                {item.deadline && <span className="shrink-0">⏳ {item.deadline}</span>}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
