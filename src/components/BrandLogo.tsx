import React from 'react';
import { useBrand } from '../contexts/BrandContext';
import { cn } from '../lib/utils';

interface BrandLogoProps {
  /** Container box size class (e.g. "w-8 h-8"). Defaults to w-8 h-8. */
  boxClassName?: string;
  /** Rounded style of the badge (only used when no image logo is set). */
  rounded?: string;
  /** Whether to render the platform name text next to the badge. */
  showName?: boolean;
  /** Extra classes for the text label. */
  nameClassName?: string;
  /** Icon/letter shown when no custom logo is configured. */
  fallbackLetter?: string;
}

export default function BrandLogo({
  boxClassName = 'w-8 h-8',
  rounded = 'rounded-lg',
  showName = true,
  nameClassName = '',
  fallbackLetter = 'l',
}: BrandLogoProps) {
  const { branding } = useBrand();

  const badge =
    branding.brandLogoUrl || branding.brandIconUrl ? (
      <img
        src={branding.brandLogoUrl || branding.brandIconUrl || ''}
        alt=""
        className={cn('object-contain', boxClassName, rounded)}
        crossOrigin="anonymous"
      />
    ) : (
      <div
        className={cn(boxClassName, rounded, 'flex items-center justify-center text-white')}
        style={{ backgroundColor: branding.primaryColor }}
      >
        <span className="font-black tracking-tighter uppercase">{fallbackLetter}</span>
      </div>
    );

  if (!showName) return badge;

  return (
    <span className="inline-flex items-center gap-2">
      {badge}
      <span
        className={cn('font-black tracking-tighter text-zinc-900', nameClassName)}
        style={{ fontFamily: 'var(--brand-font)' }}
      >
        {branding.platformName}
      </span>
    </span>
  );
}
