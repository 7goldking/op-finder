import React from 'react';
import { cn } from '@/lib/utils';
import logoUrl from '/logo.jpg';

export default function Logo({ size = 32, className, alt = 'Op Finder' }) {
  return <img src={logoUrl} alt={alt} width={size} height={size}
    className={cn('rounded-[22%] object-cover shrink-0', className)}
    style={{ width: size, height: size }} />;
}
