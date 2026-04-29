import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Building2, User, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const INTERESTS = ['AI & ML', 'Программирование', 'Дизайн', 'Бизнес', 'Стартапы', 'Наука', 'Экология', 'Искусство', 'Журналистика', 'Политика', 'Образование', 'Медицина', 'Математика', 'Финансы', 'Робототехника'];

const EDU_LEVELS = [
  { value: 'school', label: 'Школьник' },
  { value: 'bachelor', label: 'Бакалавр' },
  { value: 'master', label: 'Магистр' },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Другое' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(null); // 'participant' | 'organization'
  const [step, setStep] = useState(-1); // -1 = type selection
  const [saving, setSaving] = useState(false);

  // Participant data
  const [pData, setPData] = useState({ city: '', age: '', education_level: '', interests: [], goals: '' });

  // Organization data
  const [oData, setOData] = useState({ name: '', description: '', city: '', website: '', contact_email: '' });

  const participantSteps = [
    {
      title: 'Откуда ты?',
      subtitle: 'Поможем подбирать офлайн-события рядом',
      valid: () => pData.city.trim().length > 0,
      content: (
        <Input autoFocus value={pData.city}
          onChange={e => setPData({ ...pData, city: e.target.value })}
          placeholder="Например, Москва"
          className="h-14 text-lg rounded-xl bg-secondary border-transparent" />
      ),
    },
    {
      title: 'Сколько тебе лет?',
      subtitle: 'Для фильтра возможностей по возрасту',
      valid: () => pData.age >= 10 && pData.age <= 100,
      content: (
        <Input type="number" min={10} max={100} autoFocus value={pData.age}
          onChange={e => setPData({ ...pData, age: Number(e.target.value) })}
          placeholder="18"
          className="h-14 text-lg rounded-xl bg-secondary border-transparent" />
      ),
    },
    {
      title: 'Уровень образования',
      subtitle: 'Будем показывать подходящие события',
      valid: () => !!pData.education_level,
      content: (
        <div className="grid grid-cols-2 gap-2">
          {EDU_LEVELS.map(e => (
            <button key={e.value} onClick={() => setPData({ ...pData, education_level: e.value })}
              className={cn("p-4 rounded-xl border text-left transition-all font-medium",
                pData.education_level === e.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground/30")}>
              {e.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Что тебе интересно?',
      subtitle: 'Выбери несколько направлений',
      valid: () => pData.interests.length > 0,
      content: (
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(i => {
            const active = pData.interests.includes(i);
            return (
              <button key={i}
                onClick={() => setPData({ ...pData, interests: active ? pData.interests.filter(x => x !== i) : [...pData.interests, i] })}
                className={cn("px-4 py-2 rounded-full border text-sm transition-all inline-flex items-center gap-1.5",
                  active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground/30")}>
                {active && <Check className="w-3 h-3" />} {i}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: 'Какая твоя цель?',
      subtitle: 'ИИ-ассистент использует это для рекомендаций',
      valid: () => pData.goals.trim().length > 5,
      content: (
        <Textarea autoFocus rows={4} value={pData.goals}
          onChange={e => setPData({ ...pData, goals: e.target.value })}
          placeholder="Например: найти стажировку в IT на лето"
          className="rounded-xl bg-secondary border-transparent" />
      ),
    },
  ];

  const orgSteps = [
    {
      title: 'Название организации',
      subtitle: 'Как вас будут видеть участники',
      valid: () => oData.name.trim().length > 1,
      content: (
        <Input autoFocus value={oData.name}
          onChange={e => setOData({ ...oData, name: e.target.value })}
          placeholder="Например, Yandex Education"
          className="h-14 text-lg rounded-xl bg-secondary border-transparent" />
      ),
    },
    {
      title: 'О вашей организации',
      subtitle: 'Короткое описание для участников',
      valid: () => oData.description.trim().length > 10,
      content: (
        <Textarea autoFocus rows={4} value={oData.description}
          onChange={e => setOData({ ...oData, description: e.target.value })}
          placeholder="Чем занимается ваша организация, что проводит..."
          className="rounded-xl bg-secondary border-transparent" />
      ),
    },
    {
      title: 'Город и контакты',
      subtitle: 'Для отображения в профиле организации',
      valid: () => oData.city.trim().length > 0,
      content: (
        <div className="space-y-3">
          <Input value={oData.city}
            onChange={e => setOData({ ...oData, city: e.target.value })}
            placeholder="Город (обязательно)"
            className="h-12 rounded-xl bg-secondary border-transparent" />
          <Input type="url" value={oData.website}
            onChange={e => setOData({ ...oData, website: e.target.value })}
            placeholder="Сайт (необязательно)"
            className="h-12 rounded-xl bg-secondary border-transparent" />
          <Input type="email" value={oData.contact_email}
            onChange={e => setOData({ ...oData, contact_email: e.target.value })}
            placeholder="Контактный email (необязательно)"
            className="h-12 rounded-xl bg-secondary border-transparent" />
        </div>
      ),
    },
  ];

  // Ментор сначала заполняет базовый профиль (как участник), затем редиректится на создание менторского профиля
  const steps = accountType === 'organization' ? orgSteps : participantSteps;
  const progress = step === -1 ? 0 : ((step + 1) / steps.length) * 100;
  const cur = step >= 0 ? steps[step] : null;

  const finish = async () => {
    setSaving(true);
    if (accountType === 'mentor') {
      await base44.auth.updateMe({ ...pData, account_type: 'mentor', is_mentor: true, onboarded: true });
      navigate('/mentors/new');
      setSaving(false);
      return;
    }
    if (accountType === 'organization') {
      // Create organization record
      const me = await base44.auth.me();
      const org = await base44.entities.Organization.create({
        ...oData,
        owner_email: me.email,
      });
      await base44.auth.updateMe({
        account_type: 'organization',
        organization_id: org.id,
        onboarded: true,
      });
      navigate('/org');
    } else {
      await base44.auth.updateMe({ ...pData, account_type: 'participant', onboarded: true });
      navigate('/');
    }
    setSaving(false);
  };

  // Account type selection screen
  if (step === -1) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-3 text-balance">
              Добро пожаловать
            </h1>
            <p className="text-muted-foreground text-lg mb-10">
              Кто вы на платформе?
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => setAccountType('participant')}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all group",
                  accountType === 'participant' ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-muted transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Участник</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Студент, школьник или молодой специалист. Ищу хакатоны, стажировки, гранты и конкурсы.
                </p>
              </button>
              <button
                onClick={() => setAccountType('organization')}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all group",
                  accountType === 'organization' ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-muted transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Организация</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Компания, университет или НКО. Публикую мероприятия и управляю заявками участников.
                </p>
              </button>
              <button
                onClick={() => setAccountType('mentor')}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all group",
                  accountType === 'mentor' ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-muted transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Ментор</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Делюсь опытом и провожу сессии. Предлагаю менторские услуги студентам и специалистам.
                </p>
              </button>
            </div>
            <Button
              disabled={!accountType}
              onClick={() => setStep(0)}
              className="w-full h-12 rounded-full gap-2"
            >
              Продолжить <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{accountType === 'organization' ? 'Регистрация организации' : 'Настройка профиля'} — шаг {step + 1} из {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}>
            <h1 className="font-display text-3xl md:text-5xl font-semibold leading-tight mb-2 text-balance">
              {cur.title}
            </h1>
            <p className="text-muted-foreground mb-8">{cur.subtitle}</p>
            <div className="mb-10">{cur.content}</div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <Button variant="ghost"
            onClick={() => step === 0 ? setStep(-1) : setStep(s => s - 1)}
            className="gap-2 rounded-full">
            <ArrowLeft className="w-4 h-4" /> Назад
          </Button>
          {step < steps.length - 1 ? (
            <Button disabled={!cur.valid()} onClick={() => setStep(s => s + 1)} className="gap-2 rounded-full h-12 px-6">
              Далее <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button disabled={!cur.valid() || saving} onClick={finish} className="gap-2 rounded-full h-12 px-6">
              {saving ? 'Сохраняем...' : 'Готово'} <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}