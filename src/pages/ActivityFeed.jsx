import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { i18nExtended } from '@/lib/i18n-extended';
import { useI18n } from '@/lib/i18n';
import { Zap } from 'lucide-react';

export default function ActivityFeed() {
  const { user } = useOutletContext() || {};
  const { lang } = useI18n();
  const t = i18nExtended[lang]?.activity_feed || i18nExtended.en.activity_feed;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) loadFeed();
  }, [user?.email]);

  const loadFeed = async () => {
    try {
      const feed = await base44.entities.ActivityFeed.filter({ for_email: user.email }, '-created_date', 50);
      setActivities(feed);
    } catch {}
    setLoading(false);
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'friend_request_accepted':
        return `${activity.actor_name} ${t.accepted_friend_request}`;
      case 'new_event_application':
        return `${activity.actor_name} ${t.new_event_application} "${activity.title}"`;
      case 'new_mentor_session':
        return `${activity.actor_name} ${t.new_mentor_session}`;
      case 'new_article':
        return `${activity.actor_name} ${t.new_article} "${activity.title}"`;
      default:
        return activity.title;
    }
  };

  const getActivityLink = (activity) => {
    switch (activity.type) {
      case 'new_event_application':
      case 'new_mentor_session':
        return `/event/${activity.target_id}`;
      case 'new_article':
        return `/blog/${activity.target_id}`;
      default:
        return '#';
    }
  };

  if (loading) return <div className="p-10 text-center">{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
        <Zap className="w-8 h-8" /> {t.title}
      </h1>

      {activities.length === 0 ? (
        <div className="text-center text-muted-foreground p-10">{t.no_activity}</div>
      ) : (
        <div className="space-y-3">
          {activities.map(activity => (
            <Link
              key={activity.id}
              to={getActivityLink(activity)}
              className="p-4 rounded-xl border border-border bg-card hover:border-foreground/30 transition-all flex items-center gap-3 group"
            >
              {activity.actor_avatar_url ? (
                <img src={activity.actor_avatar_url} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
                  {(activity.actor_name || '?')[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2 group-hover:underline">
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(activity.created_date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}