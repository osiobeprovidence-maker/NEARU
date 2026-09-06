import React from 'react';
import { cn } from '../lib/utils';

export type VerificationType = 'blue' | 'rally_blue' | 'lalao_buz' | 'organization' | 'personal' | string;

export interface VerificationBadgeProps {
  type?: VerificationType | null;
  isVerified?: boolean;
  isBlueCheck?: boolean;
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
  blue: {
    label: 'Verified Profile',
    bgClass: 'text-[#1D9BF0]', // Official Vibrant Blue Check
    fillColor: '#1D9BF0',
    title: 'Verified Profile',
  },
  rally_blue: {
    label: 'Verified Profile',
    bgClass: 'text-[#1D9BF0]',
    fillColor: '#1D9BF0',
    title: 'Verified Profile',
  },
  blue_check: {
    label: 'Verified Profile',
    bgClass: 'text-[#1D9BF0]',
    fillColor: '#1D9BF0',
    title: 'Verified Profile',
  },
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
};

/**
 * Robust verification validator:
 * A user/page/organization/advertiser should ONLY display the blue verification check
 * if their RALLY Profile Verification status is actually "verified".
 *
 * It will NOT return true simply because:
 * - They are an admin.
 * - They are a page.
 * - They are an organization.
 * - They are an advertiser.
 * - They completed NIN/KYC.
 * - They have special permissions.
 */
export function isEntityVerified(entity?: any): {
  isVerified: boolean;
  isBlueCheck: boolean;
  type?: string;
} {
  if (!entity) return { isVerified: false, isBlueCheck: false };

  // Explicit check for RALLY profile blue check verification
  const isBlue = Boolean(
    entity.isBlueVerified === true ||
    entity.blueCheckStatus === 'verified' ||
    entity.verificationStatus === 'verified'
  );

  if (isBlue) {
    return { isVerified: true, isBlueCheck: true, type: 'blue' };
  }

  // Check for approved paid verification category (lalao_buz, organization, personal)
  // NEVER use NIN or admin permissions as a substitute for verification.
  if (
    entity.isVerified === true &&
    entity.verificationStatus !== 'unverified' &&
    entity.verificationStatus !== 'rejected' &&
    entity.verificationType !== 'nin'
  ) {
    return {
      isVerified: true,
      isBlueCheck: !entity.verificationType || entity.verificationType === 'lalao_buz',
      type: entity.verificationType || 'lalao_buz',
    };
  }

  return { isVerified: false, isBlueCheck: false };
}

export function ProfileVerificationCheck({
  user,
  size = 'md',
  className = '',
}: {
  user?: any;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}) {
  if (!user) return null;
  const { isVerified, isBlueCheck, type } = isEntityVerified(user);
  if (!isVerified) return null;

  return (
    <VerificationBadge
      isBlueCheck={isBlueCheck}
      type={type}
      isVerified={true}
      size={size}
      className={className}
    />
  );
}

export function VerificationBadge({
  type,
  isVerified = true,
  isBlueCheck = false,
  size = 'md',
  className = '',
  showTitle = true,
}: VerificationBadgeProps) {
  if (!isVerified && !isBlueCheck) return null;

  // Determine configuration (prefer explicit isBlueCheck, fallback to type)
  const normalizedType = isBlueCheck ? 'blue' : (type || 'organization').toLowerCase();
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

export default VerificationBadge;
