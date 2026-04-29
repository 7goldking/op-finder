import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { generateUserID } from '@/lib/user-id';

export default function GroupChatWindow({ groupId, user, onBack, onMessageSent }) {
  const { t } = useI18n();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadGroup();
    const unsub = base44.entities.GroupMessage.subscribe(e => {
      if (e.type === 'create' && e.data?.group_id === groupId) {
        setMessages(m => [...m, e.data]);
      }
    });
    return unsub;
  }, [groupId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const loadGroup = async () => {
    try {
      const g = await base44.entities.GroupChat.list();
      const found = g.find(x => x.id === groupId);
      setGroup(found);
      
      const msgs = await base44.entities.GroupMessage.filter({ group_id: groupId }, '-created_date', 100);
      setMessages(msgs.reverse());
    } catch {
      toast.error('Ошибка загрузки');
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await base44.entities.GroupMessage.create({
        group_id: groupId,
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        text: text.trim(),
      });
      setText('');
      onMessageSent?.();
      await loadGroup();
    } catch {
      toast.error('Ошибка отправки');
    }
    setSending(false);
  };

  const addMember = async () => {
    if (!memberUserId.trim()) return;
    try {
      const users = await base44.entities.User.list();
      const found = users.find(u => generateUserID(u.email) === memberUserId.toUpperCase());
      if (!found) return toast.error(t('profile.friend_not_found'));
      
      if (group.members.includes(found.email)) {
        return toast.error('Пользователь уже в группе');
      }

      await base44.entities.GroupChat.update(groupId, {
        members: [...group.members, found.email],
      });
      setMemberUserId('');
      setShowAddMember(false);
      await loadGroup();
      toast.success('Участник добавлен');
    } catch {
      toast.error('Ошибка при добавлении');
    }
  };

  const removeMember = async (email) => {
    if (group.created_by !== user.email && email !== user.email) {
      return toast.error('Только создатель может удалять');
    }
    try {
      const newMembers = group.members.filter(m => m !== email);
      await base44.entities.GroupChat.update(groupId, { members: newMembers });
      await loadGroup();
      toast.success('Участник удален');
    } catch {
      toast.error('Ошибка');
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">{t('chat.loading')}</div>;
  if (!group) return <div className="flex-1 flex items-center justify-center">Группа не найдена</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-semibold">{group.name}</h2>
            <p className="text-xs text-muted-foreground">{group.members?.length} участников</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowAddMember(!showAddMember)}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {showAddMember && (
        <div className="border-b border-border p-4 space-y-2 bg-secondary/30">
          <div className="flex gap-2">
            <Input
              value={memberUserId}
              onChange={e => setMemberUserId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMember()}
              placeholder={t('chat.member_id_ph')}
              className="h-9 text-sm"
            />
            <Button onClick={addMember} size="sm" className="rounded-lg h-9">
              {t('profile.add')}
            </Button>
          </div>
        </div>
      )}

      {/* Members */}
      {group.members?.length > 0 && (
        <div className="border-b border-border px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2">{t('chat.members')}</div>
          <div className="flex flex-wrap gap-1.5">
            {group.members.map(email => (
              <span key={email} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-xs">
                {email === user.email ? 'Ты' : email.split('@')[0]}
                {(group.created_by === user.email || email === user.email) && (
                  <button
                    onClick={() => removeMember(email)}
                    className="hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {t('chat.start')}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender_email === user.email ? 'justify-end' : ''}`}>
              <div className={`max-w-[70%] ${
                msg.sender_email === user.email
                  ? 'bg-primary text-primary-foreground rounded-3xl rounded-tr-md'
                  : 'bg-secondary rounded-3xl rounded-tl-md'
              } px-4 py-2`}>
                {msg.sender_email !== user.email && (
                  <div className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</div>
                )}
                <p className="text-sm break-words">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={t('chat.placeholder')}
          className="flex-1 bg-secondary rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          size="icon"
          className="rounded-xl w-10 h-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}