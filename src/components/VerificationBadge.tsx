import React from 'react';
import { cn } from '../lib/utils';

export type VerificationType = 'lalao_buz' | 'organization' | 'personal' | 'nin' | string;

export interface VerificationBadgeProps {
  type?: VerificationType | null;
  isVerified?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showTitle?: boolean;
}

const SIZE_MAP: Record<string, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

export const VERIFICATION_CONFIG: Record<
  string,
  { label: string; bgClass: string; fillColor: string; title: string }
> = {
  lalao_buz: {
    label: 'Lalao Buz',
    bgClass: 'text-[#2563EB]', // Blue
    fillColor: '#2563EB',
    title: 'Lalao Buz Verified',
  },
  organization: {
    label: 'Organization',
    bgClass: 'text-[#16A34A]', // Green
    fillColor: '#16A34A',
    title: 'Organization Verified',
  },
  personal: {
    label: 'Personal',
    bgClass: 'text-[#18181B] dark:text-zinc-100', // Black
    fillColor: '#18181B',
    title: 'Personal Verified',
  },
  nin: {
    label: 'Verified',
    bgClass: 'text-[#16A34A]', // Green default for legacy NIN
    fillColor: '#16A34A',
    title: 'Identity Verified',
  },
};

export default function VerificationBadge({
  type,
  isVerified = true,
  size = 'md',
  className = '',
  showTitle = true,
}: VerificationBadgeProps) {
  if (!isVerified) return null;

  // Determine configuration (default to green/organization or personal)
  const normalizedType = (type || 'organization').toLowerCase();
  const config =
    VERIFICATION_CONFIG[normalizedType] || VERIFICATION_CONFIG.organization;

  const sizeClass =
    typeof size === 'number'
      ? `w-[${size}px] h-[${size}px]`
      : SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <span
      className={cn('inline-flex items-center justify-center shrink-0 align-middle', className)}
      title={showTitle ? config.title : undefined}
      aria-label={config.title}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn(sizeClass, config.bgClass)}
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z"
        />
        <path
          d="M9.7 15.6l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z"
          fill="#FFFFFF"
        />
      </svg>
    </span>
  );
}
