import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Branding {
  platformName: string;
  brandLogoUrl: string | null;
  brandIconUrl: string | null;
  faviconUrl: string | null;
  brandFont: string;
  primaryColor: string;
}

const DEFAULT_BRANDING: Branding = {
  platformName: 'lalao',
  brandLogoUrl: null,
  brandIconUrl: null,
  faviconUrl: null,
  brandFont: 'system',
  primaryColor: '#4f46e5',
};

const FONT_MAP: Record<string, string> = {
  system: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  serif: `Georgia, "Times New Roman", serif`,
  sans: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
  mono: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
};

interface BrandContextValue {
  branding: Branding;
  /** Override the primary color on a given document fragment (e.g. a panel). */
  applyVars: (el: HTMLElement | null) => void;
}

const BrandContext = createContext<BrandContextValue>({
  branding: DEFAULT_BRANDING,
  applyVars: () => {},
});

export function useBrand() {
  return useContext(BrandContext);
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  // Load branding from the public endpoint and apply document-level overrides.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/branding');
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (!json || !json.branding) return;
        const b: Branding = {
          ...DEFAULT_BRANDING,
          ...json.branding,
        };
        if (cancelled) return;
        setBranding(b);

        // 1. Favicon
        const favicon = b.faviconUrl || b.brandIconUrl;
        if (favicon) {
          let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = favicon;
        }

        // 2. Font
        const font = FONT_MAP[b.brandFont] || FONT_MAP.system;
        document.documentElement.style.setProperty('--brand-font', font);
        document.documentElement.style.setProperty('--brand-font-family', font);

        // 3. Primary color (brand accent across buttons/backgrounds)
        if (b.primaryColor) {
          const root = document.documentElement;
          root.style.setProperty('--brand-primary', b.primaryColor);
          root.style.setProperty('--rally-primary', b.primaryColor);
          root.style.setProperty('--rally-join', b.primaryColor);
          root.style.setProperty('--rally-primary-hover', b.primaryColor);
        }

        // 4. Document title
        if (b.platformName) {
          document.title = b.platformName;
        }
      } catch {
        // ignore — fall back to defaults
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyVars = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    el.style.setProperty('--brand-font', FONT_MAP[branding.brandFont] || FONT_MAP.system);
    el.style.setProperty('--brand-primary', branding.primaryColor);
  }, [branding.brandFont, branding.primaryColor]);

  return (
    <BrandContext.Provider value={{ branding, applyVars }}>
      {children}
    </BrandContext.Provider>
  );
}
