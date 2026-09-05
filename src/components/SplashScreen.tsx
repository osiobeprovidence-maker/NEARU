import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useBrand } from '../contexts/BrandContext';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export interface SplashScreenProps {
  /** Optional active splash screen image override (e.g. from branding query or prop) */
  splashScreenUrl?: string | null;
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

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center w-[100vw] h-[100vh] min-h-[100dvh] overflow-hidden select-none p-4',
        className
      )}
      style={{
        backgroundColor: solidBg,
      }}
    >
      <Loader2 className="w-10 h-10 text-white animate-spin opacity-90" />
    </div>
  );
}

