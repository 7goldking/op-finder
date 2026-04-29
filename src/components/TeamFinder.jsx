import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, X, UserPlus, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamFinder({ event, user }) {
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [looking, setLooking] = useState('');
  const [maxSize, setMaxSize] = useState(5);
  const [saving, setSaving] = useState(false);

  const load = () => {
    base44.entities.Team.filter({ event_id: event.id }, '-created_date', 50).then(setTeams);
  };

  useEffect(() => { if (event?.id) load(); }, [event?.id]);

  if (!event) return null;

  const create = async () => {
    if (!user) return toast.error('Войдите, чтобы создать команду');
    if (!name.trim()) return toast.error('Укажите название');
    setSaving(true);
    await base44.entities.Team.create({
      event_id: event.id,
      event_title: event.title,
      name, description: desc,
      captain_email: user.email,
      captain_name: user.full_name || user.email,
      looking_for: looking.split(',').map(s => s.trim()).filter(Boolean),
      members: [{ email: user.email, name: user.full_name || user.email, role: 'Капитан' }],
      max_size: Number(maxSize) || 5,
      status: 'open',
    });
    setName(''); setDesc(''); setLooking(''); setShowForm(false);
    setSaving(false);
    load();
    toast.success('Команда создана');
  };

  const join = async (team) => {
    if (!user) return toast.error('Войдите, чтобы присоединиться');
    if (team.members?.some(m => m.email === user.email)) return toast.info('Вы уже в команде');
    if ((team.members?.length || 0) >= (team.max_size || 5)) return toast.error('Команда заполнена');

    const newMembers = [...(team.members || []), { email: user.email, name: user.full_name || user.email, role: 'Участник' }];
    const status = newMembers.length >= (team.max_size || 5) ? 'full' : 'open';
    await base44.entities.Team.update(team.id, { members: newMembers, status });
    toast.success(`Вы присоединились к "${team.name}"`);
    load();
  };

  const leave = async (team) => {
    const newMembers = (team.members || []).filter(m => m.email !== user.email);
    await base44.entities.Team.update(team.id, { members: newMembers, status: 'open' });
    toast.success('Вы вышли из команды');
    load();
  };

  const closeTeam = async (team) => {
    await base44.entities.Team.delete(team.id);
    load();
  };

  return (
    <div className="pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" /> Поиск команды
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Найди напарников или собери свою команду</p>
        </div>
        {user && !showForm && (
          <Button size="sm" variant="outline" className="rounded-full gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Создать команду
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 p-5 rounded-2xl border border-border bg-card space-y-3">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Название команды" />
          <Textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Чем занимаемся, какая идея" />
          <Input value={looking} onChange={e => setLooking(e.target.value)} placeholder="Кого ищем: frontend, дизайнер, ML-инженер (через запятую)" />
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Макс. размер:</label>
            <Input type="number" min={2} max={10} value={maxSize} onChange={e => setMaxSize(e.target.value)} className="w-20" />
          </div>
          <div className="flex gap-2">
            <Button onClick={create} disabled={saving} className="rounded-full" size="sm">
              {saving ? 'Создаём...' : 'Создать'}
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          Пока нет команд. Создай первую!
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(t => {
            const inTeam = t.members?.some(m => m.email === user?.email);
            const isCaptain = t.captain_email === user?.email;
            const full = (t.members?.length || 0) >= (t.max_size || 5);
            return (
              <div key={t.id} className="p-5 rounded-2xl border border-border bg-card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-display text-lg font-semibold">{t.name}</h4>
                      {full && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary">Заполнена</span>}
                    </div>
                    {t.description && <p className="text-sm text-muted-foreground mb-2">{t.description}</p>}
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Crown className="w-3 h-3" /> {t.captain_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-semibold">{t.members?.length || 0}/{t.max_size || 5}</div>
                    <div className="text-xs text-muted-foreground">участников</div>
                  </div>
                </div>

                {(t.looking_for || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.looking_for.map(r => (
                      <span key={r} className="px-2.5 py-1 rounded-full bg-secondary text-xs">Ищем: {r}</span>
                    ))}
                  </div>
                )}

                {(t.members || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.members.map(m => (
                      <span key={m.email} className="px-2.5 py-1 rounded-full border border-border text-xs flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold">
                          {(m.name || '?')[0].toUpperCase()}
                        </span>
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {isCaptain ? (
                    <Button size="sm" variant="outline" className="rounded-full gap-1" onClick={() => closeTeam(t)}>
                      <X className="w-3.5 h-3.5" /> Удалить команду
                    </Button>
                  ) : inTeam ? (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => leave(t)}>Выйти</Button>
                  ) : (
                    <Button size="sm" className="rounded-full gap-1" disabled={full} onClick={() => join(t)}>
                      <UserPlus className="w-3.5 h-3.5" /> Присоединиться
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}