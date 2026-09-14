import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useBrand } from '../contexts/BrandContext';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingScreenProps {
  /** Optional active loading screen image override (e.g. from branding query or prop) */
  loadingScreenUrl?: string | null;
  /** Optional solid background color override */
  backgroundColor?: string;
  /** Extra container classes if needed */
  className?: string;
}

/**
 * End-to-end dynamic loading screen for the application initialization.
 * This should ONLY be used for genuine initial load states (e.g. Auth/Profile loading),
 * and NEVER for simple internal page navigations.
 */
export default function LoadingScreen({
  loadingScreenUrl,
  backgroundColor,
  className,
}: LoadingScreenProps) {
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

  // Resolve URL based on priority: explicit prop -> query -> context -> localStorage cache fallback
  const customLoaderUrl = loadingScreenUrl ?? directBranding?.loadingScreenUrl ?? contextBranding?.loadingScreenUrl;

  return (
    <div
      role="status"
      aria-label="Loading Application"
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center w-full h-full min-h-[100dvh] overflow-hidden select-none',
        className
      )}
      style={{
        backgroundColor: solidBg,
      }}
    >
      {customLoaderUrl ? (
        <picture className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
          <img 
            src={customLoaderUrl} 
            alt="Loading..." 
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain" 
            crossOrigin="anonymous"
          />
        </picture>
      ) : (
        <Loader2 className="w-10 h-10 text-white animate-spin opacity-90 relative z-10" />
      )}
    </div>
  );
}
