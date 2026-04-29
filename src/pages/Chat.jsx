import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';
import ChatWindow from '@/components/ChatWindow';
import GroupChatList from '@/components/GroupChatList';
import GroupChatWindow from '@/components/GroupChatWindow';
import { listMyConversations, otherParticipant } from '@/lib/chat';
import { useI18n } from '@/lib/i18n';

const DATE_LOCALES = { ru, en: enUS };

export default function Chat() {
  const { user } = useOutletContext() || {};
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeId = params.get('c');
  const activeGroupId = params.get('g');
  const chatType = activeGroupId ? 'group' : 'direct';
  const { t, lang } = useI18n();

  const load = async () => {
    if (!user?.email) return;
    const list = await listMyConversations(user.email);
    setConversations(list);
    setLoading(false);
  };

  const handleSelectGroup = (groupId) => {
    setParams({ g: groupId });
  };

  useEffect(() => { load(); }, [user?.email]);
  useEffect(() => { load(); }, [activeId]);

  if (!user) return <div className="py-20 text-center text-muted-foreground">{t('chat.login_prompt')}</div>;

  const active = conversations.find(c => c.id === activeId);
  const dateLocale = DATE_LOCALES[lang] || ru;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <h1 className="font-display text-3xl font-semibold mb-6">{t('chat.title')}</h1>

      <div className="grid md:grid-cols-[320px_1fr] gap-0 rounded-2xl border border-border overflow-hidden min-h-[600px]">
        <aside className={`border-r border-border bg-card overflow-y-auto ${activeId || activeGroupId ? 'hidden md:block' : ''}`}>
          {user && <GroupChatList user={user} activeGroupId={activeGroupId} onSelectGroup={handleSelectGroup} />}
          
          <div className="px-4 py-3">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4" /> {t('chat.direct')}
            </h3>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">{t('chat.loading')}</div>
          ) : conversations.length === 0 ? (
            <div className="p-10 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('chat.empty_title')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('chat.empty_hint')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map(c => {
                const otherEmail = otherParticipant(c, user.email);
                const name = c.participant_names?.[otherEmail] || otherEmail;
                const avatar = c.participant_avatars?.[otherEmail];
                const unread = c.unread_for?.includes(user.email);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setParams({ c: c.id })}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-secondary transition-colors ${activeId === c.id ? 'bg-secondary' : ''}`}
                    >
                      <div className="w-11 h-11 rounded-full bg-secondary overflow-hidden flex items-center justify-center shrink-0 text-sm font-semibold">
                        {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="" /> : (name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${unread ? 'font-semibold' : 'font-medium'}`}>{name}</span>
                          {c.last_message_at && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatDistanceToNowStrict(new Date(c.last_message_at), { locale: dateLocale })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className={`text-xs truncate ${unread ? 'text-foreground' : 'text-muted-foreground'}`}>{c.last_message || '—'}</span>
                          {unread && <span className="w-2 h-2 rounded-full bg-foreground shrink-0" />}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className={`${activeId || activeGroupId ? 'flex' : 'hidden md:flex'} flex-col`}>
          {activeGroupId ? (
            <GroupChatWindow groupId={activeGroupId} user={user} onBack={() => setParams({})} onMessageSent={load} />
          ) : active ? (
            <ChatWindow conversation={active} user={user} onBack={() => setParams({})} onMessageSent={load} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-10">
              {t('chat.select')}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}