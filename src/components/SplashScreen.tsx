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

  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

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

  // Determine which image to show based on device width and availability
  let activeImage = null;
  if (isDesktop) {
    activeImage = desktopImage || mobileImage; // Fallback to mobile if desktop missing
  } else {
    activeImage = mobileImage || desktopImage; // Fallback to desktop if mobile missing
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center w-[100vw] h-[100vh] min-h-[100dvh] overflow-hidden select-none',
        className
      )}
      style={{
        backgroundColor: solidBg,
      }}
    >
      {activeImage ? (
        <img 
          src={activeImage} 
          alt="Splash Screen" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
      ) : (
        <Loader2 className="w-10 h-10 text-white animate-spin opacity-90 relative z-10" />
      )}
    </div>
  );
}

