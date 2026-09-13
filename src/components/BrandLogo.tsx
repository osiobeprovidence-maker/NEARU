import React from 'react';
import { useBrand } from '../contexts/BrandContext';
import { cn } from '../lib/utils';

interface BrandLogoProps {
  /** Extra classes for the text label. */
  nameClassName?: string;
  /** Kept for backwards compatibility but unused */
  boxClassName?: string;
  rounded?: string;
  showName?: boolean;
  fallbackLetter?: string;
}

export default function BrandLogo({
  nameClassName = 'text-2xl',
}: BrandLogoProps) {
  const { branding } = useBrand();

  return (
    <span className="inline-flex items-center">
      <span
        className={cn('font-normal lowercase pb-1', nameClassName)}
        style={{ 
          fontFamily: "'Pacifico', cursive",
          color: branding.primaryColor,
          lineHeight: '1'
        }}
      >
        lalao
      </span>
    </span>
  );
}
