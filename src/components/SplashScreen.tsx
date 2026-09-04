import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useBrand } from '../contexts/BrandContext';
import { cn } from '../lib/utils';

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
 *
 * Requirements:
 * 1. Uses the active image uploaded by the Admin as the primary visual element.
 * 2. Does NOT hard-code any specific logo or "L" icon when an admin image is uploaded.
 * 3. Occupies the full viewport (100vw, min-h-[100dvh], fallback h-[100vh]), centered horizontally & vertically.
 * 4. Arbitrary image dimensions are supported safely using object-fit: contain without distortion.
 * 5. If no uploaded splash image exists (or after removal), cleanly displays fallback branding.
 * 6. Clean, minimal, distraction-free: zero spinners, zero extra text, zero buttons.
 */
export default function SplashScreen({
  splashScreenUrl: propSplashUrl,
  backgroundColor,
  logoUrl: propLogoUrl,
  className,
}: SplashScreenProps) {
  // Query real-time branding directly from Convex if within ConvexProvider
  const directBranding = useQuery(api.media.getBranding);
  const { branding: contextBranding } = useBrand();
  const [imgError, setImgError] = useState(false);

  // Active uploaded splash image priority:
  // 1. Explicit prop (if provided)
  // 2. Real-time Convex query result (directBranding?.splashScreenUrl)
  // 3. BrandContext cached/fetched result (contextBranding?.splashScreenUrl)
  const uploadedSplash =
    propSplashUrl !== undefined
      ? propSplashUrl
      : (directBranding?.splashScreenUrl || contextBranding?.splashScreenUrl || null);

  // Check if a valid uploaded splash image exists and has not errored
  const hasActiveUploadedSplash = Boolean(
    uploadedSplash &&
    typeof uploadedSplash === 'string' &&
    uploadedSplash.trim() !== '' &&
    !imgError
  );

  // Background color priority: explicit prop -> theme splashBgColor -> theme primaryColor -> fallback
  const solidBg =
    backgroundColor ||
    directBranding?.splashBgColor ||
    contextBranding?.splashBgColor ||
    directBranding?.primaryColor ||
    contextBranding?.primaryColor ||
    '#4f46e5';

  // Fallback branding image
  const fallbackLogo =
    propLogoUrl ||
    contextBranding?.brandLogoUrl ||
    contextBranding?.brandIconUrl ||
    '/icon.svg';

  return (
    <div
      role="status"
      aria-label="LALOA Loading"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center w-[100vw] h-[100vh] min-h-[100dvh] overflow-hidden select-none p-4 sm:p-6 md:p-8',
        className
      )}
      style={{
        backgroundColor: solidBg,
      }}
    >
      {hasActiveUploadedSplash ? (
        /* =================================================================== */
        /* 1. ADMIN UPLOADED SPLASH IMAGE                                      */
        /* Displayed prominently as the primary visual element in full-screen. */
        /* Uses object-contain to preserve original aspect ratio cleanly.      */
        /* =================================================================== */
        <img
          src={uploadedSplash!}
          alt="App Splash Screen"
          onError={() => setImgError(true)}
          className="max-w-[85vw] max-h-[75vh] sm:max-w-[80vw] sm:max-h-[80vh] md:max-w-[75vw] md:max-h-[85vh] w-auto h-auto object-contain pointer-events-none select-none drop-shadow-sm"
          crossOrigin="anonymous"
          loading="eager"
          decoding="async"
        />
      ) : (
        /* =================================================================== */
        /* 2. CLEAN FALLBACK BRANDING                                          */
        /* Rendered ONLY when NO admin-uploaded splash image exists.           */
        /* =================================================================== */
        <img
          src={fallbackLogo}
          alt="LALOA"
          className="w-[clamp(5rem,16vw,12rem)] h-[clamp(5rem,16vw,12rem)] object-contain aspect-square pointer-events-none select-none"
          crossOrigin="anonymous"
          loading="eager"
          decoding="async"
        />
      )}
    </div>
  );
}
