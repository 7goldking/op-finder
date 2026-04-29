import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, ClipboardList, HelpCircle, Target, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MODES = [
  { key: 'topics', label: 'Темы для сессии', icon: ClipboardList, desc: 'Идеи, что обсудить на первой встрече' },
  { key: 'questions', label: 'Вопросы студенту', icon: HelpCircle, desc: 'Глубокие вопросы по его целям' },
  { key: 'plan', label: 'План развития', icon: Target, desc: 'План на 4-8 недель с milestones' },
];

export default function MentorAIAssistant({ request, mentor, student }) {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async (modeKey) => {
    setMode(modeKey);
    setLoading(true);
    setResult(null);

    const studentContext = student ? {
      name: student.full_name || request?.student_name,
      goals: student.goals,
      interests: student.interests || [],
      skills: student.skills || [],
      education_level: student.education_level,
    } : {
      name: request?.student_name,
      goals: request?.message,
    };

    const prompts = {
      topics: `Ты — опытный наставник. Предложи 6 конкретных тем для менторской сессии.
Ментор: ${mentor?.name}, экспертиза: ${(mentor?.expertise || []).join(', ')}, профиль: ${mentor?.headline}.
Студент: ${JSON.stringify(studentContext)}.
Тема заявки от студента: "${request?.topic}". Сообщение: "${request?.message || '-'}".
Темы должны быть адаптированы под уровень и цели студента.`,

      questions: `Ты — опытный коуч. Сгенерируй 8 сильных открытых вопросов, которые ментор может задать студенту, чтобы лучше понять его цели, ограничения и мотивацию.
Контекст студента: ${JSON.stringify(studentContext)}.
Тема заявки: "${request?.topic}".
Вопросы должны быть глубокими, конкретными и подталкивать к рефлексии, а не быть общими.`,

      plan: `Ты — опытный наставник. Составь персональный план развития студента на 6 недель для достижения целей.
Ментор: экспертиза ${(mentor?.expertise || []).join(', ')}.
Студент: ${JSON.stringify(studentContext)}.
Тема: "${request?.topic}".
Для каждой недели укажи: фокус, 2-3 конкретных задачи, ресурсы (книги/курсы/практика), ожидаемый результат.`
    };

    const schemas = {
      topics: {
        type: 'object',
        properties: {
          topics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                why: { type: 'string', description: 'Почему это важно для этого студента' }
              }
            }
          }
        }
      },
      questions: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                purpose: { type: 'string', description: 'Что выявит этот вопрос' }
              }
            }
          }
        }
      },
      plan: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          weeks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                week: { type: 'number' },
                focus: { type: 'string' },
                tasks: { type: 'array', items: { type: 'string' } },
                resources: { type: 'array', items: { type: 'string' } },
                outcome: { type: 'string' }
              }
            }
          }
        }
      }
    };

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[modeKey],
        response_json_schema: schemas[modeKey],
      });
      setResult(res);
    } catch (e) {
      toast.error('Не удалось сгенерировать. Попробуй ещё раз');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    let text = '';
    if (mode === 'topics') text = (result?.topics || []).map((t, i) => `${i + 1}. ${t.title}\n${t.description}\nПочему: ${t.why}`).join('\n\n');
    if (mode === 'questions') text = (result?.questions || []).map((q, i) => `${i + 1}. ${q.question}\n(${q.purpose})`).join('\n\n');
    if (mode === 'plan') {
      text = `${result?.summary}\n\n` + (result?.weeks || []).map(w =>
        `Неделя ${w.week}: ${w.focus}\nЗадачи:\n- ${(w.tasks || []).join('\n- ')}\nРесурсы:\n- ${(w.resources || []).join('\n- ')}\nРезультат: ${w.outcome}`
      ).join('\n\n');
    }
    navigator.clipboard.writeText(text);
    toast.success('Скопировано');
  };

  return (
    <div className="mt-4 p-5 rounded-2xl border border-border bg-background">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4" />
        <h4 className="font-semibold text-sm">ИИ-помощник ментора</h4>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Подготовься к сессии со студентом за секунды</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => generate(m.key)}
            disabled={loading}
            className={`text-left p-3 rounded-xl border transition-colors ${
              mode === m.key ? 'border-foreground bg-secondary' : 'border-border hover:border-foreground/40'
            } disabled:opacity-50`}
          >
            <m.icon className="w-4 h-4 mb-1.5" />
            <div className="text-sm font-medium">{m.label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Генерируем...
        </div>
      )}

      {!loading && result && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={copyResult} className="rounded-full gap-1.5 h-8">
              <Copy className="w-3 h-3" /> Копировать
            </Button>
          </div>

          {mode === 'topics' && (
            <ol className="space-y-3">
              {(result.topics || []).map((t, i) => (
                <li key={i} className="p-3 rounded-xl bg-secondary">
                  <div className="font-semibold text-sm">{i + 1}. {t.title}</div>
                  <div className="text-sm mt-1">{t.description}</div>
                  {t.why && <div className="text-xs text-muted-foreground mt-2"><span className="font-medium">Почему:</span> {t.why}</div>}
                </li>
              ))}
            </ol>
          )}

          {mode === 'questions' && (
            <ol className="space-y-2">
              {(result.questions || []).map((q, i) => (
                <li key={i} className="p-3 rounded-xl bg-secondary">
                  <div className="font-medium text-sm">{i + 1}. {q.question}</div>
                  {q.purpose && <div className="text-xs text-muted-foreground mt-1">{q.purpose}</div>}
                </li>
              ))}
            </ol>
          )}

          {mode === 'plan' && (
            <div>
              {result.summary && <p className="text-sm mb-3">{result.summary}</p>}
              <div className="space-y-2">
                {(result.weeks || []).map(w => (
                  <div key={w.week} className="p-3 rounded-xl bg-secondary">
                    <div className="font-semibold text-sm">Неделя {w.week}: {w.focus}</div>
                    {w.tasks?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Задачи</div>
                        <ul className="list-disc pl-5 text-sm mt-1 space-y-0.5">
                          {w.tasks.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                    {w.resources?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ресурсы</div>
                        <ul className="list-disc pl-5 text-sm mt-1 space-y-0.5">
                          {w.resources.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                    {w.outcome && <div className="text-xs mt-2"><span className="font-medium">Результат:</span> {w.outcome}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}