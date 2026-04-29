import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { SendIcon } from '@/components/ui/animated-state-icons';
import { format } from 'date-fns';
import { sendMessage, markRead, otherParticipant } from '@/lib/chat';
import { useI18n } from '@/lib/i18n';

export default function ChatWindow({ conversation, user, onBack, onMessageSent }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const otherEmail = otherParticipant(conversation, user.email);
  const otherName = conversation.participant_names?.[otherEmail] || otherEmail;
  const otherAvatar = conversation.participant_avatars?.[otherEmail];

  const loadMessages = () => {
    base44.entities.Message.filter({ conversation_id: conversation.id }, 'created_date', 500)
      .then(setMessages);
  };

  useEffect(() => {
    loadMessages();
    markRead(conversation, user);
  }, [conversation.id]);

  // Живое обновление: подписка + polling-фолбэк (на случай, если realtime не активен)
  useEffect(() => {
    let unsub = null;
    try {
      unsub = base44.entities.Message.subscribe?.((event) => {
        if (event.data?.conversation_id !== conversation.id) return;
        if (event.type === 'create') {
          setMessages(prev => prev.some(m => m.id === event.data.id) ? prev : [...prev, event.data]);
        }
      });
    } catch (_) { /* subscribe может быть недоступен */ }

    const interval = setInterval(loadMessages, 4000);
    return () => { unsub?.(); clearInterval(interval); };
  }, [conversation.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await sendMessage(conversation, user, text);
    setText('');
    setSending(false);
    onMessageSent?.();
  };

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onBack} className="md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-sm font-semibold">
          {otherAvatar ? <img src={otherAvatar} className="w-full h-full object-cover" alt="" /> : (otherName || '?')[0].toUpperCase()}
        </div>
        <div className="font-semibold text-sm">{otherName}</div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-background">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">{t('chat.start')}</div>
        ) : messages.map(m => {
          const mine = m.sender_email === user.email;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary rounded-bl-sm'}`}>
                <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
                <div className={`text-[10px] mt-1 ${mine ? 'opacity-70' : 'text-muted-foreground'}`}>
                  {format(new Date(m.created_date), 'HH:mm')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-border bg-card">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('chat.placeholder')}
          className="flex-1 rounded-full bg-secondary border-transparent"
        />
        <Button type="submit" size="icon" disabled={!text.trim() || sending} className="rounded-full shrink-0">
          <SendIcon size={16} color="currentColor" active={sending} />
        </Button>
      </form>
    </div>
  );
}