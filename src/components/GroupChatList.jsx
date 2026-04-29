import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export default function GroupChatList({ user, activeGroupId, onSelectGroup }) {
  const { t } = useI18n();
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [user?.email]);

  const loadGroups = async () => {
    if (!user?.email) return;
    try {
      const allGroups = await base44.entities.GroupChat.list('-created_date', 100);
      const userGroups = allGroups.filter(g => g.members?.some(m => m === user.email));
      setGroups(userGroups);
    } catch {
      setGroups([]);
    }
    setLoading(false);
  };

  const createGroup = async () => {
    if (!formData.name.trim()) return toast.error(t('chat.group_name'));
    setSaving(true);
    try {
      await base44.entities.GroupChat.create({
        name: formData.name,
        description: formData.description,
        created_by: user.email,
        members: [user.email],
        avatar_url: '',
      });
      setFormData({ name: '', description: '' });
      setShowForm(false);
      await loadGroups();
      toast.success('Группа создана');
    } catch {
      toast.error('Ошибка при создании группы');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-4 text-sm text-muted-foreground">{t('chat.loading')}</div>;

  return (
    <div className="border-b border-border pb-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Users className="w-4 h-4" /> {t('chat.groups')}
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setShowForm(!showForm)} className="rounded-lg h-8 px-2">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 rounded-lg border border-border bg-card space-y-2">
          <Input
            value={formData.name}
            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
            placeholder={t('chat.group_name_ph')}
            className="h-9 text-sm rounded-lg bg-secondary border-transparent"
          />
          <Textarea
            rows={2}
            value={formData.description}
            onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
            placeholder={t('chat.group_desc_ph')}
            className="text-sm rounded-lg bg-secondary border-transparent"
          />
          <div className="flex gap-2">
            <Button onClick={createGroup} disabled={saving} size="sm" className="rounded-lg text-xs h-8">
              {saving ? '...' : t('chat.create_group')}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} size="sm" className="rounded-lg h-8">
              {t('profile.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {groups.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-3">Нет групп</div>
        ) : (
          groups.map(g => (
            <button
              key={g.id}
              onClick={() => onSelectGroup(g.id, 'group')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeGroupId === g.id ? 'bg-secondary' : 'hover:bg-secondary/50'
              }`}
            >
              <div className="font-medium truncate">{g.name}</div>
              <div className="text-xs text-muted-foreground">{g.members?.length || 0} участников</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}