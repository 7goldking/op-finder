import React from 'react';
import { Link as LinkIcon } from 'lucide-react';

const ICONS = {
  telegram: '✈️', instagram: '📷', linkedin: '💼', github: '🐙',
  twitter: '𝕏', vk: '🅥', youtube: '▶️', tiktok: '🎵',
  behance: '🎨', dribbble: '🏀', website: '🌐',
};

const LABELS = {
  telegram: 'Telegram', instagram: 'Instagram', linkedin: 'LinkedIn', github: 'GitHub',
  twitter: 'X', vk: 'VK', youtube: 'YouTube', tiktok: 'TikTok',
  behance: 'Behance', dribbble: 'Dribbble', website: 'Сайт',
};

function normalizeUrl(platform, raw) {
  if (!raw) return '';
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('@')) {
    const u = v.slice(1);
    if (platform === 'telegram') return `https://t.me/${u}`;
    if (platform === 'instagram') return `https://instagram.com/${u}`;
    if (platform === 'twitter') return `https://x.com/${u}`;
    if (platform === 'tiktok') return `https://tiktok.com/@${u}`;
    if (platform === 'youtube') return `https://youtube.com/@${u}`;
  }
  return `https://${v}`;
}

export default function SocialLinksDisplay({ links = [], className = '' }) {
  const valid = (links || []).filter(l => l?.url);
  if (!valid.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {valid.map((link, i) => {
        const icon = ICONS[link.platform];
        const label = link.label || LABELS[link.platform] || 'Ссылка';
        const href = normalizeUrl(link.platform, link.url);
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/70 text-sm transition-colors"
          >
            {icon ? <span>{icon}</span> : <LinkIcon className="w-3.5 h-3.5" />}
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
}