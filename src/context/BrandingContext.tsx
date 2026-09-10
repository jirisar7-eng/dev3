import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiClient';

export interface BrandingData {
  id?: string;
  primaryLogoSvg?: string | null;
  darkLogoSvg?: string | null;
  faviconSvg?: string | null;
  logoAlt?: string | null;
  version?: number;
  updatedAt?: string;
  [key: string]: any;
}

interface BrandingContextType {
  branding: BrandingData | null;
  loading: boolean;
  reloadBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Globals for revoking object URLs to prevent memory leaks
let activeManifestUrl: string | null = null;

const updateDynamicFavicon = (faviconSvg?: string | null) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');

  if (faviconSvg && faviconSvg.trim()) {
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(faviconSvg)}`;

    links.forEach((link) => {
      link.setAttribute('href', dataUrl);
    });
  } else {
    // Reset to defaults
    links.forEach((link) => {
      const type = link.getAttribute('type');
      const sizes = link.getAttribute('sizes');
      if (type === 'image/svg+xml') {
        link.setAttribute('href', '/icon.svg');
      } else if (sizes === '32x32') {
        link.setAttribute('href', '/favicon-32x32.png');
      } else if (sizes === '16x16') {
        link.setAttribute('href', '/favicon-16x16.png');
      } else {
        link.setAttribute('href', '/favicon.ico');
      }
    });
  }
};

const updateDynamicMetadata = (branding?: BrandingData | null) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (branding && branding.primaryLogoSvg && branding.primaryLogoSvg.trim()) {
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(branding.primaryLogoSvg)}`;

    const appleTouchIcon: HTMLLinkElement | null = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
      appleTouchIcon.setAttribute('href', dataUrl);
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', dataUrl);

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) twitterImage.setAttribute('content', dataUrl);
  }
};

const updateDynamicManifest = (branding?: BrandingData | null) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const manifestLink: HTMLLinkElement | null = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) return;

  if (activeManifestUrl) {
    URL.revokeObjectURL(activeManifestUrl);
    activeManifestUrl = null;
  }

  const baseManifest = {
    name: branding?.logoAlt || 'Táta má právo',
    short_name: branding?.logoAlt || 'Táta má právo',
    description: 'Informační a klientský portál pro otce v rozvodové situaci, sdílené rodičovství a krizovou pomoc.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#1e3a8a',
    background_color: '#f8fafc',
    icons: [
      {
        src: branding?.faviconSvg ? `data:image/svg+xml;utf8,${encodeURIComponent(branding.faviconSvg)}` : '/favicon.ico',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: branding?.primaryLogoSvg ? `data:image/svg+xml;utf8,${encodeURIComponent(branding.primaryLogoSvg)}` : '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };

  const manifestBlob = new Blob([JSON.stringify(baseManifest, null, 2)], { type: 'application/json' });
  activeManifestUrl = URL.createObjectURL(manifestBlob);
  manifestLink.setAttribute('href', activeManifestUrl);
};

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBranding = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/public/branding');
      if (res.ok) {
        const data = await res.json();
        setBranding(data);
        if (data) {
          updateDynamicFavicon(data.faviconSvg);
          updateDynamicMetadata(data);
          updateDynamicManifest(data);
        }
      }
    } catch (e) {
      console.warn('[BrandingContext] Failed to fetch branding:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  useEffect(() => {
    const handleBrandingUpdate = () => {
      fetchBranding();
    };
    window.addEventListener('branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('branding-updated', handleBrandingUpdate);
  }, [fetchBranding]);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        reloadBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return ctx;
};
