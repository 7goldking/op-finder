import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              n <= (hovered || value) ? 'fill-warning text-warning' : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function EventReviews({ eventId, eventTitle, organizationName, organizationId, hasApplied, user, isOrgOwner }) {
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!eventId) return;
    base44.entities.Review.filter({ event_id: eventId }, '-created_date', 50).then(list => {
      setReviews(list);
      if (user?.email) {
        const mine = list.find(r => r.author_email === user.email);
        if (mine) setMyReview(mine);
      }
    });
  }, [eventId, user]);

  const sendReply = async (review) => {
    if (!replyText.trim()) return;
    const updated = await base44.entities.Review.update(review.id, {
      org_reply: replyText,
      org_reply_author: organizationName,
      org_reply_date: new Date().toISOString(),
    });
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, ...updated } : r));
    setReplyingTo(null);
    setReplyText('');
    toast.success('Ответ опубликован');
  };

  const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

  const submit = async () => {
    if (!rating) return toast.error('Поставь оценку');
    setSaving(true);
    const data = {
      event_id: eventId,
      event_title: eventTitle,
      organization_name: organizationName,
      organization_id: organizationId,
      rating,
      text,
      author_name: user?.full_name || 'Участник',
      author_email: user?.email || '',
    };
    const created = await base44.entities.Review.create(data);
    setReviews(prev => [created, ...prev]);
    setMyReview(created);
    setShowForm(false);
    toast.success('Отзыв опубликован');
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-xl font-semibold">Отзывы</h3>
          {avg && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-semibold">{avg}</span>
              <span className="text-sm text-muted-foreground">({reviews.length})</span>
            </div>
          )}
        </div>
        {hasApplied && !myReview && !showForm && (
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowForm(true)}>
            Оставить отзыв
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 p-5 rounded-2xl border border-border bg-card">
          <p className="text-sm font-medium mb-3">Твоя оценка</p>
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            className="mt-4 rounded-xl bg-secondary border-transparent"
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Расскажи об опыте участия..."
          />
          <div className="flex gap-2 mt-3">
            <Button onClick={submit} disabled={saving || !rating} className="rounded-full" size="sm">
              {saving ? 'Публикуем...' : 'Опубликовать'}
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </div>
      )}

      {myReview && (
        <div className="mb-4 p-4 rounded-xl border border-border bg-secondary/40">
          <div className="flex items-center gap-2 mb-1">
            <StarRating value={myReview.rating} readonly />
            <span className="text-xs text-muted-foreground">Ваш отзыв</span>
          </div>
          {myReview.text && <p className="text-sm">{myReview.text}</p>}
        </div>
      )}

      {reviews.filter(r => r.author_email !== user?.email).length === 0 && !showForm ? (
        <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          {hasApplied ? 'Будь первым, кто оставит отзыв' : 'Отзывы участников появятся здесь'}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.filter(r => r.author_email !== user?.email).map(r => (
            <div key={r.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary text-xs font-semibold flex items-center justify-center">
                    {(r.author_name || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{r.author_name || 'Участник'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} readonly />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(r.created_date), 'd MMM', { locale: ru })}
                  </span>
                </div>
              </div>
              {r.text && <p className="text-sm text-foreground/80">{r.text}</p>}

              {r.org_reply && (
                <div className="mt-3 pl-3 border-l-2 border-primary/30 bg-secondary/40 rounded-r-lg p-3">
                  <div className="text-xs font-semibold mb-1">{r.org_reply_author || organizationName} · Организатор</div>
                  <p className="text-sm text-foreground/80">{r.org_reply}</p>
                </div>
              )}

              {isOrgOwner && !r.org_reply && replyingTo !== r.id && (
                <button
                  onClick={() => { setReplyingTo(r.id); setReplyText(''); }}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  Ответить
                </button>
              )}

              {replyingTo === r.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    rows={2}
                    className="rounded-xl bg-secondary border-transparent text-sm"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Ваш ответ как организатор..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-full" onClick={() => sendReply(r)}>Опубликовать</Button>
                    <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setReplyingTo(null)}>Отмена</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}