import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const BADGES = [
  {
    id: 'first_application',
    icon: '🚀',
    title: 'Первый шаг',
    description: 'Подай первую заявку на событие',
    check: ({ apps }) => apps.length >= 1,
    progress: ({ apps }) => ({ current: Math.min(apps.length, 1), max: 1 }),
    color: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
  },
  {
    id: 'five_applications',
    icon: '🎯',
    title: 'Активный участник',
    description: 'Подай 5 заявок на разные события',
    check: ({ apps }) => apps.length >= 5,
    progress: ({ apps }) => ({ current: Math.min(apps.length, 5), max: 5 }),
    color: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
  },
  {
    id: 'accepted',
    icon: '🏆',
    title: 'Победитель',
    description: 'Получи принятую заявку на событие',
    check: ({ apps }) => apps.some(a => a.status === 'accepted'),
    progress: ({ apps }) => ({ current: apps.filter(a => a.status === 'accepted').length > 0 ? 1 : 0, max: 1 }),
    color: 'from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/30',
  },
  {
    id: 'mentor_session',
    icon: '🎓',
    title: 'Ученик',
    description: 'Запроси менторскую сессию',
    check: ({ mentorRequests }) => mentorRequests.length >= 1,
    progress: ({ mentorRequests }) => ({ current: Math.min(mentorRequests.length, 1), max: 1 }),
    color: 'from-green-500/20 to-green-600/10',
    border: 'border-green-500/30',
  },
  {
    id: 'five_mentor_sessions',
    icon: '🧠',
    title: 'Менти года',
    description: 'Завершите 5 менторских сессий',
    check: ({ mentorRequests }) => mentorRequests.filter(r => r.status === 'completed').length >= 5,
    progress: ({ mentorRequests }) => ({ current: Math.min(mentorRequests.filter(r => r.status === 'completed').length, 5), max: 5 }),
    color: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
  },
  {
    id: 'portfolio_project',
    icon: '💼',
    title: 'Строитель портфолио',
    description: 'Добавь первый проект в портфолио',
    check: ({ projects }) => projects.length >= 1,
    progress: ({ projects }) => ({ current: Math.min(projects.length, 1), max: 1 }),
    color: 'from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/30',
  },
  {
    id: 'team_member',
    icon: '🤝',
    title: 'Командный игрок',
    description: 'Вступи в команду или создай свою',
    check: ({ teams }) => teams.length >= 1,
    progress: ({ teams }) => ({ current: Math.min(teams.length, 1), max: 1 }),
    color: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/30',
  },
  {
    id: 'blogger',
    icon: '✍️',
    title: 'Блогер',
    description: 'Опубликуй статью в блоге',
    check: ({ articles }) => articles.length >= 1,
    progress: ({ articles }) => ({ current: Math.min(articles.length, 1), max: 1 }),
    color: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/30',
  },
  {
    id: 'ten_applications',
    icon: '⚡',
    title: 'Про-активный',
    description: 'Подай 10 заявок на события',
    check: ({ apps }) => apps.length >= 10,
    progress: ({ apps }) => ({ current: Math.min(apps.length, 10), max: 10 }),
    color: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
  },
  {
    id: 'reviewer',
    icon: '⭐',
    title: 'Критик',
    description: 'Оставь отзыв о событии',
    check: ({ reviews }) => reviews.length >= 1,
    progress: ({ reviews }) => ({ current: Math.min(reviews.length, 1), max: 1 }),
    color: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
  },
];

export default function Achievements() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const [apps, mentorRequests, projects, teams, articles, reviews] = await Promise.all([
        base44.entities.Application.filter({ user_email: u.email }),
        base44.entities.MentorshipRequest.filter({ student_email: u.email }),
        base44.entities.Project.filter({ created_by: u.email }),
        base44.entities.Team.list('-created_date', 100).then(ts => ts.filter(t => t.members?.some(m => m.email === u.email))),
        base44.entities.Article.filter({ author_email: u.email }),
        base44.entities.Review.filter({ author_email: u.email }),
      ]);
      setData({ apps, mentorRequests, projects, teams, articles, reviews });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const earned = data ? BADGES.filter(b => b.check(data)) : [];
  const locked = data ? BADGES.filter(b => !b.check(data)) : BADGES;
  const points = earned.length * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-semibold mb-2">Достижения</h1>
        <p className="text-muted-foreground">Твои заслуги и прогресс на платформе</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="p-5 rounded-2xl border border-border bg-card text-center">
          <div className="font-display text-3xl font-semibold">{earned.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Получено</div>
        </div>
        <div className="p-5 rounded-2xl border border-border bg-card text-center">
          <div className="font-display text-3xl font-semibold">{BADGES.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Всего</div>
        </div>
        <div className="p-5 rounded-2xl bg-primary text-primary-foreground text-center">
          <div className="font-display text-3xl font-semibold">{points}</div>
          <div className="text-xs opacity-70 mt-1">Очков</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">Общий прогресс</span>
          <span className="font-medium">{earned.length}/{BADGES.length}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(earned.length / BADGES.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Получено
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {earned.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`p-5 rounded-2xl border bg-gradient-to-br ${badge.color} ${badge.border}`}
              >
                <div className="text-3xl mb-3">{badge.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
            <Lock className="w-5 h-5" /> Не получено
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {locked.map(badge => {
              const prog = data ? badge.progress(data) : { current: 0, max: 1 };
              return (
                <div key={badge.id} className="p-5 rounded-2xl border border-border bg-card opacity-60">
                  <div className="text-3xl mb-3 grayscale">{badge.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{badge.description}</p>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-muted-foreground rounded-full transition-all"
                      style={{ width: `${(prog.current / prog.max) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{prog.current}/{prog.max}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}