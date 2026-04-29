import React from 'react';
import { STATUS_LABELS } from '@/lib/categories';
import { cn } from '@/lib/utils';

export default function StatusBadge({ status, className }) {
  const s = STATUS_LABELS[status] || { label: status, color: 'bg-secondary' };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      s.color,
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {s.label}
    </span>
  );
}