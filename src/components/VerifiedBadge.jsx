import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export default function VerifiedBadge({ size = 'sm', showLabel = false, className }) {
  const { t } = useI18n();
  const px = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const label = t('verified.label');
  if (showLabel) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium',
          className,
        )}
        title={t('verified.tooltip')}
      >
        <BadgeCheck className={px} />
        {label}
      </span>
    );
  }
  return (
    <BadgeCheck
      className={cn('text-primary shrink-0', px, className)}
      aria-label={label}
      title={t('verified.tooltip')}
    />
  );
}
