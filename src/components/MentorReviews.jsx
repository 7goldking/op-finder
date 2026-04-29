import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
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
          <Star className={`${cls} transition-colors ${
            n <= (hovered || value) ? 'fill-warning text-warning' : 'text-muted-foreground/30'
          }`} />
        </button>
      ))}
    </div>
  );
}

export { StarRating };

export default function MentorReviews({ mentor, user, completedRequest }) {
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mentor?.id) return;
    base44.entities.MentorReview.filter({ mentor_id: mentor.id }, '-created_date', 100).then(list => {
      setReviews(list);
      if (user?.email) {
        const mine = list.find(r => r.author_email === user.email);
        if (mine) setMyReview(mine);
      }
    });
  }, [mentor?.id, user]);

  const submit = async () => {
    if (!rating) { toast.error('Поставь оценку'); return; }
    setSaving(true);
    const created = await base44.entities.MentorReview.create({
      mentor_id: mentor.id,
      mentor_name: mentor.name,
      request_id: completedRequest?.id,
      topic: completedRequest?.topic,
      rating,
      text,
      author_name: user?.full_name || 'Студент',
      author_email: user?.email || '',
    });
    setReviews(prev => [created, ...prev]);
    setMyReview(created);
    setShowForm(false);
    setRating(0); setText('');
    toast.success('Отзыв опубликован');
    setSaving(false);
  };

  const canReview = completedRequest && !myReview;
  const others = reviews.filter(r => r.author_email !== user?.email);

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-4">Отзывы студентов ({reviews.length})</h2>

      {canReview && !showForm && (
        <div className="mb-4 p-4 rounded-2xl border border-dashed border-border flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm">Ты завершил сессию — поделись впечатлением</div>
          <Button size="sm" className="rounded-full" onClick={() => setShowForm(true)}>Оставить отзыв</Button>
        </div>
      )}

      {showForm && (
        <div className="mb-5 p-5 rounded-2xl border border-border bg-card">
          <p className="text-sm font-medium mb-3">Твоя оценка</p>
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            className="mt-4 rounded-xl bg-secondary border-transparent"
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Как прошла сессия? Что было полезно?"
          />
          <div className="flex gap-2 mt-3">
            <Button onClick={submit} disabled={saving || !rating} size="sm" className="rounded-full">
              {saving ? 'Публикуем...' : 'Опубликовать'}
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </div>
      )}

      {myReview && (
        <div className="mb-4 p-4 rounded-xl border border-border bg-secondary/40">
          <div className="flex items-center gap-2 mb-1">
            <StarRating value={myReview.rating} readonly size="sm" />
            <span className="text-xs text-muted-foreground">Ваш отзыв</span>
          </div>
          {myReview.text && <p className="text-sm">{myReview.text}</p>}
        </div>
      )}

      {others.length === 0 && !myReview ? (
        <div className="py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          Пока нет отзывов
        </div>
      ) : (
        <div className="space-y-3">
          {others.map(r => (
            <div key={r.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary text-xs font-semibold flex items-center justify-center">
                    {(r.author_name || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{r.author_name || 'Студент'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} readonly size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(r.created_date), 'd MMM', { locale: ru })}
                  </span>
                </div>
              </div>
              {r.topic && <div className="text-xs text-muted-foreground mb-1">Тема: {r.topic}</div>}
              {r.text && <p className="text-sm text-foreground/80">{r.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}