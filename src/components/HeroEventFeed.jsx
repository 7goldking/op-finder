import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Award, Sparkles, MapPin, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';

const CATEGORY_ICONS = {
  hackathon: Zap,
  grant: Award,
  internship: Sparkles,
  olympiad: Award,
  volunteering: Sparkles,
  summer_school: Calendar,
  mentorship: Sparkles,
  forum: Sparkles,
  exchange: Sparkles,
  competition: Zap,
};

function EventItem({ event, featured, onClick }) {
  const Icon = CATEGORY_ICONS[event.category] || Sparkles;
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card transition-all cursor-pointer hover:border-foreground/20 ${featured ? 'shadow-lg border-foreground/15 scale-[1.02]' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${featured ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm leading-tight truncate">{event.title}</div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {event.event_start && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(event.event_start), 'MMM yyyy', { locale: ruLocale })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.city || (event.format === 'online' ? 'Онлайн' : '—')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HeroEventFeed({ events: initialEvents, navigate }) {
  const [events, setEvents] = useState(initialEvents || []);
  const [visible, setVisible] = useState(0); // index of top visible item

  // Subscribe to real-time new events
  useEffect(() => {
    const unsub = base44.entities.Event.subscribe((evt) => {
      if (evt.type === 'create' && evt.data?.status === 'published') {
        setEvents(prev => [evt.data, ...prev]);
      }
    });
    return unsub;
  }, []);

  // Keep events in sync with parent fetch
  useEffect(() => {
    if (initialEvents?.length) setEvents(initialEvents);
  }, [initialEvents]);

  // Auto-scroll: advance by 1 every 2.5s
  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(v => (v + 1) % events.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [events.length]);

  if (!events.length) return null;

  // Show a window of 5 items starting from `visible`
  const WINDOW = 5;
  const shown = Array.from({ length: Math.min(WINDOW, events.length) }, (_, i) =>
    events[(visible + i) % events.length]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="hidden md:flex flex-col gap-2 w-[340px] lg:w-[380px] shrink-0 max-h-[520px] overflow-hidden"
    >
      <AnimatePresence mode="popLayout">
        {shown.map((item, i) => (
          <motion.div
            key={item.id + '-' + i}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <EventItem
              event={item}
              featured={i === 1}
              onClick={() => navigate(`/event/${item.id}`)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}