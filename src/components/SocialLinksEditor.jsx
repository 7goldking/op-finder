import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Link as LinkIcon } from 'lucide-react';

// Preset platforms with their icon (emoji fallback) and URL hint
const PRESETS = [
  { key: 'telegram', label: 'Telegram', icon: '✈️', placeholder: '@username или https://t.me/...' },
  { key: 'instagram', label: 'Instagram', icon: '📷', placeholder: '@username или https://instagram.com/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/in/...' },
  { key: 'github', label: 'GitHub', icon: '🐙', placeholder: 'https://github.com/...' },
  { key: 'twitter', label: 'X / Twitter', icon: '𝕏', placeholder: '@username или https://x.com/...' },
  { key: 'vk', label: 'VK', icon: '🅥', placeholder: 'https://vk.com/...' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'https://youtube.com/@...' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: '@username' },
  { key: 'behance', label: 'Behance', icon: '🎨', placeholder: 'https://behance.net/...' },
  { key: 'dribbble', label: 'Dribbble', icon: '🏀', placeholder: 'https://dribbble.com/...' },
  { key: 'website', label: 'Сайт', icon: '🌐', placeholder: 'https://...' },
];

export default function SocialLinksEditor({ links = [], onChange }) {
  const update = (idx, patch) => {
    const next = links.map((l, i) => i === idx ? { ...l, ...patch } : l);
    onChange(next);
  };

  const remove = (idx) => onChange(links.filter((_, i) => i !== idx));

  const add = (preset) => {
    onChange([...links, {
      platform: preset?.key || 'custom',
      label: preset?.label || '',
      url: '',
    }]);
  };

  const usedKeys = new Set(links.map(l => l.platform));
  const available = PRESETS.filter(p => !usedKeys.has(p.key));

  return (
    <div className="space-y-3">
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, idx) => {
            const preset = PRESETS.find(p => p.key === link.platform);
            const isCustom = link.platform === 'custom';
            return (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-secondary flex items-center justify-center text-lg">
                  {preset?.icon || <LinkIcon className="w-4 h-4" />}
                </div>
                <div className="flex-1 flex gap-2 min-w-0">
                  {isCustom && (
                    <Input
                      value={link.label || ''}
                      onChange={e => update(idx, { label: e.target.value })}
                      placeholder="Название"
                      className="h-10 rounded-lg bg-secondary border-transparent w-32 shrink-0"
                    />
                  )}
                  <Input
                    value={link.url || ''}
                    onChange={e => update(idx, { url: e.target.value })}
                    placeholder={preset?.placeholder || 'https://...'}
                    className="h-10 rounded-lg bg-secondary border-transparent flex-1 min-w-0"
                  />
                </div>
                <button
                  onClick={() => remove(idx)}
                  className="w-9 h-9 shrink-0 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive"
                  aria-label="Удалить"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {available.map(p => (
          <Button
            key={p.key}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => add(p)}
            className="rounded-full gap-1.5"
          >
            <span>{p.icon}</span> {p.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => add(null)}
          className="rounded-full gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Другое
        </Button>
      </div>
    </div>
  );
}