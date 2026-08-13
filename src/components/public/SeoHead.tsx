import React, { useEffect } from 'react';

interface SeoHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogType?: string;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  canonicalPath = '/',
  ogType = 'website',
}) => {
  useEffect(() => {
    const defaultTitle = 'Táta má právo • Pro nejlepší zájem dítěte';
    const fullTitle = title ? `${title} | Táta má právo` : defaultTitle;
    document.title = fullTitle;

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const descContent =
      description ||
      'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující nejlepší zájem dítěte.';
    metaDesc.setAttribute('content', descContent);

    // Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    const fullUrl = `${window.location.origin}${canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath}`;
    linkCanonical.setAttribute('href', fullUrl);

    // Helper for Open Graph
    const setOgTag = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setOgTag('og:title', fullTitle);
    setOgTag('og:description', descContent);
    setOgTag('og:url', fullUrl);
    setOgTag('og:type', ogType);
    setOgTag('og:site_name', 'Táta má právo');
  }, [title, description, canonicalPath, ogType]);

  return null;
};
