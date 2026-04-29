import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Crown, UserPlus, X, Search, MessageCircle, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export default function Teams() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', looking_for: '', max_size: 5, event_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Team.list('-created_date', 100).then(setTeams);
    base44.entities.Event.filter({ status: 'published' }, '-created_date', 50).then(setEvents);
  }, []);

  const create = async () => {
    if (!user) return toast.error(lang === 'en' ? 'Sign in to create a team' : 'Войдите, чтобы создать команду');
    if (!form.name.trim()) return toast.error(lang === 'en' ? 'Enter team name' : 'Укажите название');
    setSaving(true);
    const event = events.find(e => e.id === form.event_id);
    await base44.entities.Team.create({
      event_id: form.event_id,
      event_title: event?.title || '',
      name: form.name,
      description: form.description,
      captain_email: user.email,
      captain_name: user.full_name || user.email,
      looking_for: form.looking_for.split(',').map(s => s.trim()).filter(Boolean),
      members: [{ email: user.email, name: user.full_name || user.email, role: lang === 'en' ? 'Captain' : 'Капитан' }],
      max_size: Number(form.max_size) || 5,
      status: 'open',
    });
    setForm({ name: '', description: '', looking_for: '', max_size: 5, event_id: '' });
    setShowForm(false);
    setSaving(false);
    base44.entities.Team.list('-created_date', 100).then(setTeams);
    toast.success(lang === 'en' ? 'Team created!' : 'Команда создана!');
  };

  const join = async (team) => {
    if (!user) return toast.error(lang === 'en' ? 'Sign in to join' : 'Войдите, чтобы присоединиться');
    if (team.members?.some(m => m.email === user.email)) return toast.info(lang === 'en' ? 'Already in team' : 'Вы уже в команде');
    if ((team.members?.length || 0) >= (team.max_size || 5)) return toast.error(lang === 'en' ? 'Team is full' : 'Команда заполнена');
    const newMembers = [...(team.members || []), { email: user.email, name: user.full_name || user.email, role: lang === 'en' ? 'Member' : 'Участник' }];
    const status = newMembers.length >= (team.max_size || 5) ? 'full' : 'open';
    await base44.entities.Team.update(team.id, { members: newMembers, status });
    toast.success(lang === 'en' ? `Joined "${team.name}"!` : `Вы в команде "${team.name}"!`);
    base44.entities.Team.list('-created_date', 100).then(setTeams);
  };

  const leave = async (team) => {
    const newMembers = (team.members || []).filter(m => m.email !== user.email);
    await base44.entities.Team.update(team.id, { members: newMembers, status: 'open' });
    toast.success(lang === 'en' ? 'Left team' : 'Вы вышли из команды');
    base44.entities.Team.list('-created_date', 100).then(setTeams);
  };

  const deleteTeam = async (team) => {
    await base44.entities.Team.delete(team.id);
    setTeams(prev => prev.filter(t => t.id !== team.id));
    toast.success(lang === 'en' ? 'Team deleted' : 'Команда удалена');
  };

  const filtered = teams.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    (t.looking_for || []).some(r => r.toLowerCase().includes(search.toLowerCase()))
  );

  const myTeams = user ? teams.filter(t => t.members?.some(m => m.email === user.email)) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
         <div>
           <h1 className="font-display text-4xl font-semibold">{lang === 'en' ? 'Teams' : 'Команды'}</h1>
           <p className="text-muted-foreground mt-1">{lang === 'en' ? 'Find teammates or build your hackathon team' : 'Найди напарников или собери свою команду для хакатона'}</p>
         </div>
         {user && (
           <Button onClick={() => setShowForm(!showForm)} className="rounded-full gap-2">
             <Plus className="w-4 h-4" /> {lang === 'en' ? 'Create team' : 'Создать команду'}
           </Button>
         )}
       </div>

      {/* My teams */}
      {myTeams.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5" /> {lang === 'en' ? 'My Teams' : 'Мои команды'}
          </h2>
          <div className="space-y-3">
            {myTeams.map(t => (
              <TeamCard key={t.id} team={t} user={user} onJoin={join} onLeave={leave} onDelete={deleteTeam} highlight />
            ))}
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-8 p-6 rounded-2xl border border-border bg-card space-y-4">
          <h3 className="font-display text-lg font-semibold">{lang === 'en' ? 'New Team' : 'Новая команда'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={lang === 'en' ? 'Team name *' : 'Название команды *'} />
            <Select value={form.event_id} onValueChange={v => setForm(f => ({ ...f, event_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={lang === 'en' ? 'Event (optional)' : 'Событие (необязательно)'} />
              </SelectTrigger>
              <SelectContent>
                {events.length === 0 ? (
                  <SelectItem value={null} disabled>{lang === 'en' ? 'No events available' : 'События недоступны'}</SelectItem>
                ) : (
                  events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={lang === 'en' ? 'Team description, project idea' : 'Описание команды, идея проекта'} />
          <div className="grid md:grid-cols-2 gap-4">
            <Input value={form.looking_for} onChange={e => setForm(f => ({ ...f, looking_for: e.target.value }))} placeholder={lang === 'en' ? 'Looking for: frontend, designer (comma-separated)' : 'Кого ищем: frontend, дизайнер (через запятую)'} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">{lang === 'en' ? 'Max members:' : 'Макс. участников:'}</label>
              <Input type="number" min={2} max={20} value={form.max_size} onChange={e => setForm(f => ({ ...f, max_size: e.target.value }))} className="w-20" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={create} disabled={saving} className="rounded-full">{saving ? (lang === 'en' ? 'Creating...' : 'Создаём...') : (lang === 'en' ? 'Create team' : 'Создать команду')}</Button>
            <Button variant="ghost" className="rounded-full" onClick={() => setShowForm(false)}>{lang === 'en' ? 'Cancel' : 'Отмена'}</Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'en' ? 'Search teams by name or role...' : 'Поиск команд по названию или роли...'} className="pl-9" />
      </div>

      {/* All teams */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-2xl text-muted-foreground">
            {search ? (lang === 'en' ? 'No teams found' : 'Команды не найдены') : (lang === 'en' ? 'No teams yet. Create the first one!' : 'Пока нет команд. Создай первую!')}
          </div>
        ) : (
          filtered.map(t => (
            <TeamCard key={t.id} team={t} user={user} onJoin={join} onLeave={leave} onDelete={deleteTeam} lang={lang} />
          ))
        )}
      </div>
      </div>
      );
      }

      function TeamCard({ team: t, user, onJoin, onLeave, onDelete, highlight, lang = 'ru' }) {
  const inTeam = t.members?.some(m => m.email === user?.email);
  const isCaptain = t.captain_email === user?.email;
  const full = (t.members?.length || 0) >= (t.max_size || 5);
  const fillPct = Math.round(((t.members?.length || 0) / (t.max_size || 5)) * 100);

  return (
    <div className={`p-5 rounded-2xl border bg-card ${highlight ? 'border-foreground/30' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-display text-lg font-semibold">{t.name}</h3>
            {full && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary">{lang === 'en' ? 'Full' : 'Заполнена'}</span>}
            {isCaptain && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">{lang === 'en' ? 'You\'re captain' : 'Вы капитан'}</span>}
          </div>
          {t.event_title && (
            <div className="text-xs text-muted-foreground mb-1">📅 {t.event_title}</div>
          )}
          {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Crown className="w-3 h-3" /> {t.captain_name}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-xl font-semibold">{t.members?.length || 0}/{t.max_size || 5}</div>
          <div className="text-xs text-muted-foreground">{lang === 'en' ? 'members' : 'участников'}</div>
          <div className="w-16 h-1.5 rounded-full bg-secondary mt-1.5 overflow-hidden">
            <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${fillPct}%` }} />
          </div>
        </div>
      </div>

      {(t.looking_for || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {t.looking_for.map(r => (
            <span key={r} className="px-2.5 py-1 rounded-full bg-secondary text-xs">🔍 {r}</span>
          ))}
        </div>
      )}

      {(t.members || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {t.members.map(m => (
            <span key={m.email} className={`px-2.5 py-1 rounded-full border text-xs flex items-center gap-1 ${m.email === user?.email ? 'border-foreground/40 bg-secondary' : 'border-border'}`}>
              <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold">
                {(m.name || '?')[0].toUpperCase()}
              </span>
              {m.name}
              {(m.role === 'Капитан' || m.role === 'Captain') && <Crown className="w-2.5 h-2.5 text-muted-foreground" />}
              </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {isCaptain ? (
          <Button size="sm" variant="outline" className="rounded-full gap-1 text-destructive hover:text-destructive" onClick={() => onDelete(t)}>
            <X className="w-3.5 h-3.5" /> {lang === 'en' ? 'Delete team' : 'Удалить команду'}
          </Button>
        ) : inTeam ? (
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => onLeave(t)}>{lang === 'en' ? 'Leave team' : 'Выйти из команды'}</Button>
        ) : (
          <Button size="sm" className="rounded-full gap-1" disabled={full || !user} onClick={() => onJoin(t)}>
            <UserPlus className="w-3.5 h-3.5" /> {lang === 'en' ? 'Join' : 'Присоединиться'}
          </Button>
        )}
        {inTeam && (
          <Button size="sm" variant="outline" className="rounded-full gap-1" asChild>
            <a href="/chat"><MessageCircle className="w-3.5 h-3.5" /> {lang === 'en' ? 'Chat' : 'Написать в чат'}</a>
          </Button>
        )}
      </div>
    </div>
  );
}