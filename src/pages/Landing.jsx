import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { InfiniteGrid } from '@/components/ui/the-infinite-grid';
import { ArrowRight, Sparkles, Search, Users, GraduationCap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n, LANGS } from '@/lib/i18n';
import Logo from '@/components/Logo';

export default function Landing() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();

  const ENTRY_POINTS = [
    {
      icon: Search,
      labelKey: 'landing.entry_find',
      descKey: 'landing.entry_find_desc',
      to: '/home',
      accent: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20',
      iconColor: 'text-orange-500',
    },
    {
      icon: Sparkles,
      labelKey: 'landing.entry_ai',
      descKey: 'landing.entry_ai_desc',
      to: '/assistant',
      accent: 'bg-primary/10 hover:bg-primary/20 border-primary/20',
      iconColor: 'text-primary',
    },
    {
      icon: GraduationCap,
      labelKey: 'landing.entry_mentors',
      descKey: 'landing.entry_mentors_desc',
      to: '/mentors',
      accent: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',
      iconColor: 'text-blue-500',
    },
    {
      icon: Users,
      labelKey: 'landing.entry_community',
      descKey: 'landing.entry_community_desc',
      to: '/teams',
      accent: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20',
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <InfiniteGrid className="min-h-screen">
      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 p-1 rounded-full border border-border bg-card/80 backdrop-blur-sm">
        <Globe className="w-3.5 h-3.5 text-muted-foreground ml-2" />
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase transition-all ${
              lang === l
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-20">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <Logo size={72} className="shadow-2xl" />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/60 backdrop-blur-sm text-sm text-muted-foreground mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          {t('landing.badge')}
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.92] tracking-tight text-center text-balance mb-6"
          style={{ textShadow: '0 0 60px hsl(var(--foreground) / 0.15)' }}
        >
          {t('landing.hero1')}<br />
          <span className="italic font-medium">{t('landing.hero2')}</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="text-base md:text-lg text-muted-foreground text-center max-w-xl mb-12 leading-relaxed"
        >
          {t('landing.sub')}&nbsp;
          <span className="text-foreground font-medium">{t('landing.sub_bold')}</span>
        </motion.p>

        {/* Entry cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mb-10"
        >
          {ENTRY_POINTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`group flex flex-col items-start gap-2 p-4 rounded-2xl border backdrop-blur-sm transition-all active:scale-95 text-left ${item.accent}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-background/60 ${item.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{t(item.labelKey)}</div>
                  <div className="text-xs text-muted-foreground leading-tight mt-0.5">{t(item.descKey)}</div>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Button
            size="lg"
            onClick={() => navigate('/home')}
            className="rounded-full h-12 px-8 text-base font-semibold gap-2"
          >
            {t('landing.cta_enter')} <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/assistant')}
            className="rounded-full h-12 px-8 text-base font-semibold gap-2"
          >
            <Sparkles className="w-4 h-4" /> {t('landing.cta_ai')}
          </Button>
        </motion.div>

      </div>
    </InfiniteGrid>
  );
}