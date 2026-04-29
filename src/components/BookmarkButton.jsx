import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function BookmarkButton({ event, className }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event?.id) return;
    base44.entities.Bookmark.filter({ event_id: event.id })
      .then(list => { if (list[0]) { setBookmarked(true); setBookmarkId(list[0].id); } })
      .catch(() => {});
  }, [event?.id]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    if (bookmarked) {
      // Optimistic update
      const prevId = bookmarkId;
      setBookmarked(false); setBookmarkId(null);
      toast.success('Убрано из избранного');
      await base44.entities.Bookmark.delete(prevId).catch(() => {
        setBookmarked(true); setBookmarkId(prevId);
        toast.error('Ошибка, попробуй снова');
      });
    } else {
      // Optimistic update
      setBookmarked(true);
      toast.success('Добавлено в избранное');
      const b = await base44.entities.Bookmark.create({
        event_id: event.id,
        event_title: event.title,
        event_cover_url: event.cover_url,
        event_deadline: event.application_deadline,
        event_category: event.category,
      }).catch(() => {
        setBookmarked(false);
        toast.error('Ошибка, попробуй снова');
        return null;
      });
      if (b) setBookmarkId(b.id);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      aria-label={bookmarked ? 'Убрать из избранного' : 'В избранное'}
      title={bookmarked ? 'Убрать из избранного' : 'В избранное'}
      className={cn(
        "w-11 h-11 rounded-full flex items-center justify-center transition-all",
        bookmarked
          ? "bg-primary text-primary-foreground"
          : "bg-background/80 backdrop-blur hover:bg-background text-foreground",
        className
      )}
    >
      <Bookmark className={cn("w-3.5 h-3.5", bookmarked && "fill-current")} />
    </button>
  );
}