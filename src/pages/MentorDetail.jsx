import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Briefcase, Globe, Linkedin, Send, Check, X, Star, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import SocialLinksDisplay from '@/components/SocialLinksDisplay';
import MentorReviews from '@/components/MentorReviews';
import MentorAIAssistant from '@/components/MentorAIAssistant';
import MessageButton from '@/components/MessageButton';
import { buildICS, downloadICS } from '@/lib/ics';
import { CalendarPlus } from 'lucide-react';

export default function MentorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [form, setForm] = useState({ topic: '', message: '', preferred_date: '' });
  const [sending, setSending] = useState(false);
  const [reviewStats, setReviewStats] = useState({ avg: null, count: 0 });
  const [myCompleted, setMyCompleted] = useState(null);
  const [studentsCache, setStudentsCache] = useState({});
  const [aiOpenFor, setAiOpenFor] = useState(null);
  const [myAccepted, setMyAccepted] = useState(null);

  useEffect(() => {
    base44.entities.Mentor.filter({ id }).then(list => {
      setMentor(list[0]);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!mentor) return;
    if (user?.email === mentor.user_email) {
      base44.entities.MentorshipRequest.filter({ mentor_id: mentor.id }, '-created_date', 50).then(async (list) => {
        setIncoming(list);
        // Предзагружаем профили студентов для ИИ-помощника
        const emails = [...new Set(list.map(r => r.student_email).filter(Boolean))];
        if (emails.length) {
          const users = await base44.entities.User.filter({ email: { $in: emails } });
          const map = {};
          users.forEach(u => { map[u.email] = u; });
          setStudentsCache(map);
        }
      });
    }
    base44.entities.MentorReview.filter({ mentor_id: mentor.id }, '-created_date', 100).then(list => {
      const count = list.length;
      const avg = count ? list.reduce((s, r) => s + (r.rating || 0), 0) / count : null;
      setReviewStats({ avg, count });
    });
    if (user?.email && user.email !== mentor.user_email) {
      base44.entities.MentorshipRequest.filter({ mentor_id: mentor.id, student_email: user.email, status: 'completed' }, '-created_date', 1)
        .then(list => setMyCompleted(list[0] || null));
      base44.entities.MentorshipRequest.filter({ mentor_id: mentor.id, student_email: user.email, status: 'accepted' }, '-created_date', 1)
        .then(list => setMyAccepted(list[0] || null));
    }
  }, [mentor, user]);

  const completeSession = async (req) => {
    await base44.entities.MentorshipRequest.update(req.id, { status: 'completed' });
    setIncoming(prev => prev.map(r => r.id === req.id ? { ...r, status: 'completed' } : r));
    toast.success('Сессия отмечена завершённой');
  };

  if (loading) return <div className="py-16 text-center text-muted-foreground">Загрузка...</div>;
  if (!mentor) return <div className="py-16 text-center text-muted-foreground">Ментор не найден</div>;

  const isOwner = user?.email === mentor.user_email;
  const free = !mentor.price_per_session;

  const submit = async () => {
    if (!form.topic.trim()) { toast.error('Укажи тему сессии'); return; }
    setSending(true);
    await base44.entities.MentorshipRequest.create({
      mentor_id: mentor.id,
      mentor_name: mentor.name,
      mentor_email: mentor.user_email,
      student_name: user?.full_name || 'Студент',
      student_email: user?.email || '',
      topic: form.topic,
      message: form.message,
      preferred_date: form.preferred_date || undefined,
      status: 'pending',
    });
    setSending(false);
    setShowForm(false);
    setForm({ topic: '', message: '', preferred_date: '' });
    toast.success('Заявка отправлена');
  };

  const replyTo = async (req, status) => {
    await base44.entities.MentorshipRequest.update(req.id, { status });
    setIncoming(prev => prev.map(r => r.id === req.id ? { ...r, status } : r));
    toast.success(status === 'accepted' ? 'Принято' : 'Отклонено');
  };

  const downloadMeeting = (req) => {
    const start = req.preferred_date ? new Date(`${req.preferred_date}T10:00:00`) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const ics = buildICS({
      title: `Менторская сессия: ${req.topic}`,
      description: `Тема: ${req.topic}\n${req.message ? `Сообщение: ${req.message}\n` : ''}Ментор: ${mentor.name}\nСтудент: ${req.student_name}`,
      start,
      end: new Date(start.getTime() + 60 * 60 * 1000),
      organizer: { name: mentor.name, email: mentor.user_email },
      attendees: [{ name: req.student_name, email: req.student_email }],
      location: mentor.session_format === 'online' ? 'Онлайн' : (mentor.session_format === 'offline' ? 'Офлайн' : ''),
    });
    downloadICS(`mentorship-${req.id}.ics`, ics);
    toast.success('Файл .ics скачан — открой в календаре');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 mb-8">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-2xl font-semibold shrink-0">
            {mentor.avatar_url ? (
              <img src={mentor.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (mentor.name || '?')[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-semibold">{mentor.name}</h1>
            <p className="text-muted-foreground mt-1">{mentor.headline}</p>
            {reviewStats.count > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-sm">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="font-semibold">{reviewStats.avg.toFixed(1)}</span>
                <span className="text-muted-foreground">· {reviewStats.count} {reviewStats.count === 1 ? 'отзыв' : 'отзывов'}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              {mentor.years_experience > 0 && (
                <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> {mentor.years_experience} лет опыта</span>
              )}
              <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" /> {mentor.session_format === 'online' ? 'Онлайн' : mentor.session_format === 'offline' ? 'Очно' : 'Гибрид'}</span>
              {mentor.linkedin_url && (
                <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                  <Linkedin className="w-3 h-3" /> LinkedIn
                </a>
              )}
            </div>
          </div>
          <div className={`text-lg font-display font-semibold ${free ? 'text-success' : ''}`}>
            {free ? 'Бесплатно' : `${mentor.price_per_session}₽ / сессия`}
          </div>
        </div>

        {mentor.bio && <p className="mt-6 text-foreground/80 leading-relaxed whitespace-pre-wrap">{mentor.bio}</p>}

        {mentor.social_links?.length > 0 && (
          <div className="mt-5">
            <SocialLinksDisplay links={mentor.social_links} />
          </div>
        )}

        {(mentor.expertise || []).length > 0 && (
          <div className="mt-5 pt-5 border-t border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Экспертиза</div>
            <div className="flex flex-wrap gap-1.5">
              {mentor.expertise.map(t => <span key={t} className="px-3 py-1 rounded-full bg-secondary text-sm">#{t}</span>)}
            </div>
          </div>
        )}

        {isOwner ? (
          <div className="mt-6 flex gap-2">
            <Link to={`/mentors/${mentor.id}/edit`}><Button variant="outline" className="rounded-full">Редактировать</Button></Link>
          </div>
        ) : mentor.accepting_requests ? (
          <div className="mt-6">
            {!showForm ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => user ? setShowForm(true) : base44.auth.redirectToLogin(window.location.href)} className="rounded-full gap-2">
                  <Send className="w-4 h-4" /> Записаться на услуги
                </Button>
                <MessageButton other={{ email: mentor.user_email, name: mentor.name, avatar_url: mentor.avatar_url }} user={user} />
              </div>
            ) : (
              <div className="mt-4 space-y-3 p-5 rounded-2xl bg-secondary">
                <div>
                  <Label className="text-xs">Тема сессии *</Label>
                  <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className="mt-1 h-11 rounded-xl bg-background border-transparent" placeholder="О чём хочешь поговорить?" />
                </div>
                <div>
                  <Label className="text-xs">Сообщение</Label>
                  <Textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="mt-1 rounded-xl bg-background border-transparent" placeholder="Расскажи о себе и своих целях" />
                </div>
                <div>
                  <Label className="text-xs">Желаемая дата</Label>
                  <Input type="date" value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} className="mt-1 h-11 rounded-xl bg-background border-transparent" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={submit} disabled={sending} className="rounded-full">{sending ? 'Отправляем...' : 'Отправить'}</Button>
                  <Button onClick={() => setShowForm(false)} variant="ghost" className="rounded-full">Отмена</Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 text-sm text-muted-foreground">Ментор сейчас не принимает заявки</div>
        )}
      </div>

      {/* Incoming requests for owner */}
      {isOwner && (
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Входящие заявки ({incoming.length})</h2>
          {incoming.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-2xl text-muted-foreground text-sm">Пока нет заявок</div>
          ) : (
            <div className="space-y-3">
              {incoming.map(r => (
                <div key={r.id} className="p-5 rounded-2xl border border-border bg-card">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-semibold">{r.student_name}</div>
                      <div className="text-xs text-muted-foreground">{r.student_email}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'accepted' ? 'bg-success/10 text-success' :
                      r.status === 'declined' ? 'bg-destructive/10 text-destructive' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {r.status === 'pending' ? 'Новая' : r.status === 'accepted' ? 'Принята' : r.status === 'declined' ? 'Отклонена' : 'Завершена'}
                    </span>
                  </div>
                  <div className="mt-3 text-sm"><span className="font-medium">Тема:</span> {r.topic}</div>
                  {r.message && <p className="mt-1 text-sm text-foreground/80">{r.message}</p>}
                  {r.preferred_date && <div className="mt-2 text-xs text-muted-foreground">Желаемая дата: {r.preferred_date}</div>}
                  {r.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => replyTo(r, 'accepted')} className="rounded-full gap-1.5"><Check className="w-3.5 h-3.5" /> Принять</Button>
                      <Button size="sm" variant="outline" onClick={() => replyTo(r, 'declined')} className="rounded-full gap-1.5"><X className="w-3.5 h-3.5" /> Отклонить</Button>
                    </div>
                  )}
                  {r.status === 'accepted' && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => completeSession(r)} className="rounded-full gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Отметить как проведённую
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadMeeting(r)} className="rounded-full gap-1.5">
                        <CalendarPlus className="w-3.5 h-3.5" /> В календарь (.ics)
                      </Button>
                      <MessageButton
                        other={{ email: r.student_email, name: r.student_name, avatar_url: studentsCache[r.student_email]?.avatar_url }}
                        user={user}
                        size="sm"
                        label="Написать студенту"
                      />
                      <Button size="sm" variant="outline" onClick={() => setAiOpenFor(aiOpenFor === r.id ? null : r.id)} className="rounded-full gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> {aiOpenFor === r.id ? 'Скрыть ИИ-помощника' : 'ИИ-помощник'}
                      </Button>
                    </div>
                  )}
                  {aiOpenFor === r.id && (
                    <MentorAIAssistant request={r} mentor={mentor} student={studentsCache[r.student_email]} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Принятая заявка — для студента */}
      {!isOwner && myAccepted && (
        <div className="mt-6 p-5 rounded-2xl border border-success/30 bg-success/5">
          <div className="font-semibold text-sm mb-1">Твоя заявка принята 🎉</div>
          <div className="text-sm text-foreground/80 mb-3">Тема: {myAccepted.topic}{myAccepted.preferred_date ? ` · ${myAccepted.preferred_date}` : ''}</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadMeeting(myAccepted)} className="rounded-full gap-1.5">
              <CalendarPlus className="w-3.5 h-3.5" /> В календарь (.ics)
            </Button>
            <MessageButton other={{ email: mentor.user_email, name: mentor.name, avatar_url: mentor.avatar_url }} user={user} size="sm" label="Написать ментору" />
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-10">
        <MentorReviews mentor={mentor} user={user} completedRequest={!isOwner ? myCompleted : null} />
      </div>
    </div>
  );
}