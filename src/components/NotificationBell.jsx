import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { NotificationIcon } from '@/components/ui/animated-state-icons';

const TYPE_CONFIG = {
  application_accepted: { label: 'Заявка принята', color: 'text-green-600', dot: 'bg-green-500' },
  application_rejected: { label: 'Заявка отклонена', color: 'text-destructive', dot: 'bg-destructive' },
  application_in_review: { label: 'Заявка на рассмотрении', color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

function Dot({ className }) {
  return (
    <svg width="6" height="6" fill="currentColor" viewBox="0 0 6 6" className={className} aria-hidden="true">
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

export default function NotificationBell({ userEmail }) {
  const [notifs, setNotifs] = useState([]);
  const [ringTrigger, setRingTrigger] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.Notification.filter({ user_email: userEmail }, '-created_date', 20).then(setNotifs);
  }, [userEmail]);

  const unread = notifs.filter(n => !n.read).length;

  // Ring the bell when new unread arrives
  useEffect(() => {
    if (unread > 0) {
      setRingTrigger(true);
      const t = setTimeout(() => setRingTrigger(false), 700);
      return () => clearTimeout(t);
    }
  }, [unread]);

  const markAllRead = async () => {
    const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
    await Promise.all(unreadIds.map(id => base44.entities.Notification.update(id, { read: true })));
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { read: true });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Открыть уведомления"
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <NotificationIcon size={18} active={ringTrigger} hasUnread={unread > 0} />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center rounded-full">
              {unread > 99 ? '99+' : unread}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-1">
        <div className="flex items-baseline justify-between gap-4 px-3 py-2">
          <div className="text-sm font-semibold">Уведомления</div>
          {unread > 0 && (
            <button className="text-xs font-medium hover:underline" onClick={markAllRead}>
              Прочитать все
            </button>
          )}
        </div>
        <div role="separator" className="-mx-1 my-1 h-px bg-border" />
        <div className="max-h-96 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Нет уведомлений</div>
          ) : notifs.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || {};
            return (
              <div
                key={n.id}
                className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent cursor-pointer"
                onClick={() => markRead(n.id)}
              >
                <div className="relative flex items-start gap-3 pe-3">
                  <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', cfg.dot, n.read && 'opacity-30')} />
                  <div className="flex-1 space-y-1">
                    <div className={cn('font-medium', cfg.color)}>{cfg.label}</div>
                    {n.event_title && (
                      <div className="text-xs text-muted-foreground truncate">{n.event_title}</div>
                    )}
                    {n.event_id && (
                      <Link to={`/event/${n.event_id}`} className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground">
                        Посмотреть событие
                      </Link>
                    )}
                  </div>
                  {!n.read && (
                    <div className="absolute end-0 self-center text-primary">
                      <Dot />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}