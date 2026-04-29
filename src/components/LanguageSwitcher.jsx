import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n, LANGS } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LABELS = { ru: 'Русский', en: 'English', kz: 'Қазақша' };

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Language"
          className="flex items-center gap-1.5 h-9 px-3 rounded-full hover:bg-secondary text-xs font-semibold uppercase tracking-wide transition-colors"
        >
          <Globe className="w-4 h-4" />
          {!compact && <span>{lang}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className={lang === l ? 'font-semibold bg-secondary' : ''}
          >
            <span className="uppercase text-xs w-8">{l}</span>
            <span className="text-sm">{LABELS[l]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}