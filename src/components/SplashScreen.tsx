import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useBrand } from '../contexts/BrandContext';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export interface SplashScreenProps {
  /** Optional active splash screen image override (e.g. from branding query or prop) */
  splashScreenUrl?: string | null;
  /** Optional active desktop splash screen image override */
  desktopSplashScreenUrl?: string | null;
  /** Optional solid background color override */
  backgroundColor?: string;
  /** Optional avatar/logo URL override for fallback */
  logoUrl?: string | null;
  /** Extra container classes if needed */
  className?: string;
}

/**
 * End-to-end dynamic loading/splash screen for the LALOA app.
 * Displays only a simple centered loading spinner over the selected app background color.
 */
export default function SplashScreen({
  splashScreenUrl,
  desktopSplashScreenUrl,
  backgroundColor,
  className,
}: SplashScreenProps) {
  // Query real-time branding directly from Convex if within ConvexProvider
  const directBranding = useQuery(api.media.getBranding);
  const { branding: contextBranding } = useBrand();

  // Background color priority: explicit prop -> theme splashBgColor -> theme primaryColor -> fallback
  const solidBg =
    backgroundColor ||
    directBranding?.splashBgColor ||
    contextBranding?.splashBgColor ||
    directBranding?.primaryColor ||
    contextBranding?.primaryColor ||
    '#4f46e5';

  // Resolve URLs based on priority: explicit prop -> query -> context -> localStorage cache fallback
  // The localStorage is primarily used in App.tsx to pass the prop directly.
  const mobileImage = splashScreenUrl ?? directBranding?.splashScreenUrl ?? contextBranding?.splashScreenUrl;
  const desktopImage = desktopSplashScreenUrl ?? directBranding?.desktopSplashScreenUrl ?? contextBranding?.desktopSplashScreenUrl;

  const hasImage = mobileImage || desktopImage;
  const fallbackSrc = mobileImage || desktopImage || '';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center w-full h-full min-h-[100dvh] overflow-hidden select-none',
        className
      )}
      style={{
        backgroundColor: solidBg,
      }}
    >
      {hasImage ? (
        <picture className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
          {mobileImage && <source media="(max-width: 767px)" srcSet={mobileImage} />}
          {desktopImage && <source media="(min-width: 768px)" srcSet={desktopImage} />}
          <img 
            src={fallbackSrc} 
            alt="Splash Screen" 
            className="w-full h-full object-contain" 
          />
        </picture>
      ) : (
        <Loader2 className="w-10 h-10 text-white animate-spin opacity-90 relative z-10" />
      )}
    </div>
  );
}

