import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { Sparkles, Loader2, User, Trash2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const QUICK_PROMPTS = [
  'Объясни квантовые вычисления простыми словами',
  'Как написать сильное резюме?',
  'Помоги написать мотивационное письмо',
  'Как выучить программирование с нуля?',
  'Какие есть тренды в IT в 2025 году?',
  'Посоветуй как подготовиться к собеседованию',
];

const STORAGE_KEY_PREFIX = 'opfinder_chat_history';
const getStorageKey = (email) => email ? `${STORAGE_KEY_PREFIX}:${email}` : null;

export default function AIChat() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        try {
          const key = getStorageKey(userData?.email);
          if (key) {
            const saved = localStorage.getItem(key);
            if (saved) setMessages(JSON.parse(saved));
          }
        } catch {}
      } catch {}
      setHistoryLoaded(true);

      try {
        const eventsData = await base44.entities.Event.filter({ status: 'published' }, '-created_date', 15);
        setEvents(eventsData);
      } catch {}

      try {
        const mentorsData = await base44.entities.Mentor.list('-created_date', 10);
        setMentors(mentorsData);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (location.state?.prefill) setInput(location.state.prefill);
  }, [location.state]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!historyLoaded) return;
    const key = getStorageKey(user?.email);
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(messages.slice(-40))); } catch {}
  }, [messages, user?.email, historyLoaded]);

  const clear = () => {
    setMessages([]);
    const key = getStorageKey(user?.email);
    if (key) localStorage.removeItem(key);
    toast.success('История очищена');
  };

  const send = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const history = newMessages.slice(-20).map(m =>
      `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`
    ).join('\n\n');

    const eventsContext = events.slice(0, 15).map(e =>
      `- "${e.title}" [${e.category}] ${e.format || ''} ${e.city ? '· ' + e.city : ''} ${e.application_deadline ? '· дедлайн: ' + new Date(e.application_deadline).toLocaleDateString('ru') : ''} | ID: ${e.id}`
    ).join('\n');

    const mentorsContext = mentors.slice(0, 10).map(m =>
      `- ${m.name} — ${m.headline} | Экспертиза: ${(m.expertise || []).join(', ')} | Формат: ${m.session_format || 'online'} | Цена: ${m.price_per_session === 0 ? 'бесплатно' : (m.price_per_session || '?') + ' ₸'} | ID: ${m.id}`
    ).join('\n');

    const defaultSystemPrompt = `Ты — умный универсальный ИИ-ассистент по имени Opfinder AI. Ты можешь отвечать на любые вопросы И выполнять действия на платформе Opfinder.

Профиль пользователя:
- Имя: ${user?.full_name || 'не указано'}
- Город: ${user?.city || 'не указан'}
- Интересы: ${(user?.interests || []).join(', ') || 'не указаны'}
- Навыки: ${(user?.skills || []).join(', ') || 'не указаны'}

Актуальные события на платформе:
${eventsContext || 'нет данных'}

Доступные менторы:
${mentorsContext || 'нет данных'}

История диалога:
${history}

Правила:
- Отвечай на том языке на котором пишет пользователь
- Используй markdown для форматирования
- Будь дружелюбным, умным и полезным
- Давай развёрнутые, точные и содержательные ответы
- ВАЖНО: если пользователь просит найти события или менторов — используй данные выше и давай конкретные рекомендации с названиями
- При рекомендации событий — упоминай название, формат, дедлайн и ссылку вида /event/[ID]
- При рекомендации менторов — упоминай имя, специализацию, цену и ссылку вида /mentors/[ID]
- Если не знаешь что-то точно — честно скажи об этом`;

    const systemPrompt = user?.ai_system_prompt ? `${user.ai_system_prompt}\n\nКонтекст платформы:\n${eventsContext ? 'События: ' + eventsContext + '\n' : ''}${mentorsContext ? 'Менторы: ' + mentorsContext + '\n' : ''}История: ${history}` : defaultSystemPrompt;

    try {
      const { data: groqData, error: groqError } = await supabase.functions.invoke('groq-chat', {
        body: { systemPrompt, messages: newMessages.slice(-20).map(m => ({ role: m.role, content: m.content })) },
      });
      if (groqError) throw groqError;
      const replyText = groqData?.reply || 'Нет ответа';
      setMessages(m => [...m, { role: 'assistant', content: replyText }]);
    } catch (error) {
      const errorMsg = error.message || 'Что-то пошло не так, попробуй ещё раз.';
      setMessages(m => [...m, { role: 'assistant', content: errorMsg }]);
    }

    setLoading(false);
  }, [input, messages, loading, user, events, mentors]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">ИИ-ассистент</h1>
            <p className="text-xs text-muted-foreground">Llama 3.3 · быстрый ответ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clear} title="Очистить историю">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-5 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-2">Чем могу помочь?</h2>
            <p className="text-muted-foreground text-sm mb-8">Задай любой вопрос или выбери готовый</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-xl mx-auto">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-left p-3.5 rounded-xl border border-border bg-card hover:border-foreground/30 hover:bg-secondary/50 transition-all text-sm leading-snug"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                m.role === 'user'
                  ? 'bg-secondary'
                  : 'bg-primary text-primary-foreground'
              }`}>
                {m.role === 'user'
                  ? (user?.avatar_url
                    ? <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                    : <User className="w-4 h-4" />)
                  : <Sparkles className="w-4 h-4" />
                }
              </div>
              <div className={`max-w-[85%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-secondary rounded-tl-sm'
                }`}>
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-border/60">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Напиши сообщение..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-2xl bg-secondary border-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 max-h-40 overflow-y-auto"
            style={{ minHeight: '48px' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
            }}
          />
          <Button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="rounded-2xl h-12 w-12 p-0 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ассистент может ошибаться — проверяй важную информацию
        </p>
      </div>
    </div>
  );
}