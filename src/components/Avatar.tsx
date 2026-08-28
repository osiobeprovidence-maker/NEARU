import React, { useState, useMemo } from 'react';
import { cn } from '../lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const BG_COLORS = [
  'bg-indigo-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500',
];

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name.trim()[0] || '?').toUpperCase();
}

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolvedSrc = useMemo(() => {
    if (!src) return null;
    if (
      src.startsWith('http://') || 
      src.startsWith('https://') || 
      src.startsWith('blob:') || 
      src.startsWith('data:')
    ) {
      return src;
    }
    return null;
  }, [src]);

  const showImage = resolvedSrc && !failed;

  const colorIndex = useMemo(() => {
    const base = (name || '').toUpperCase();
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    }
    return hash % BG_COLORS.length;
  }, [name]);

  if (!showImage) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white select-none shrink-0',
          SIZE_CLASSES[size],
          BG_COLORS[colorIndex],
          className
        )}
        aria-label={name || 'avatar'}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={name || 'avatar'}
      onError={() => setFailed(true)}
      className={cn('rounded-full object-cover shrink-0', SIZE_CLASSES[size], className)}
    />
  );
}
