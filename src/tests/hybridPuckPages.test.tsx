import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { PublicPortal } from '../components/public/PublicPortal';
import { dbStore } from '../services/dbStore';
import { cmsCache } from '../services/cmsCache';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

vi.mock('../components/public/SeoHead', () => ({
  SeoHead: ({ title }: { title: string }) => <div data-testid="seo-head">{title}</div>
}));

vi.mock('../components/public/ArticlesSection', () => ({
  ArticlesSection: () => <div data-testid="fallback-articles">Původní články</div>
}));

vi.mock('../components/public/FaqSection', () => ({
  FaqSection: () => <div data-testid="fallback-faq">Původní FAQ</div>
}));

vi.mock('../components/public/ContactView', () => ({
  ContactView: ({ formOnly }: { formOnly?: boolean }) => (
    <div data-testid="contact-view">{formOnly ? 'Kontakt Form' : 'Celý Kontakt'}</div>
  )
}));

vi.mock('../components/public/VolunteersPage', () => ({
  VolunteersPage: ({ formOnly }: { formOnly?: boolean }) => (
    <div data-testid="volunteers-page">{formOnly ? 'Dobrovolníci Form' : 'Celí Dobrovolníci'}</div>
  )
}));

vi.mock('../pages/SupportUsPage', () => ({
  default: ({ interactiveOnly }: { interactiveOnly?: boolean }) => (
    <div data-testid="support-page">{interactiveOnly ? 'Podpora Interactive' : 'Celá Podpora'}</div>
  )
}));

// Mock CmsPageRenderer to bypass actual DB/network in basic routing tests
vi.mock('../components/public/CmsPageRenderer', () => ({
  CmsPageRenderer: ({ slug }: { slug: string }) => <div data-testid={`cms-renderer-${slug}`}>Puck obsah pro {slug}</div>
}));

describe('Hybrid Puck Pages Migration - Batch 2', () => {
  let originalGetItem: typeof Storage.prototype.getItem;

  beforeEach(() => {
    originalGetItem = Storage.prototype.getItem;
    vi.clearAllMocks();
  });

  afterEach(() => {
    Storage.prototype.getItem = originalGetItem;
  });

  const setupFlag = (flagName: string, value: string) => {
    Storage.prototype.getItem = vi.fn((key: string) => {
      if (key === flagName) return value;
      return null;
    });
  };

  const testCases = [
    { slug: 'clanky', flag: 'PUCK_CLANKY_RENDERER_ENABLED', fallbackId: 'fallback-articles', originalText: 'Původní články' },
    { slug: 'faq', flag: 'PUCK_FAQ_RENDERER_ENABLED', fallbackId: 'fallback-faq', originalText: 'Původní FAQ' },
    { slug: 'kontakt', flag: 'PUCK_KONTAKT_RENDERER_ENABLED', interactiveId: 'contact-view', fallbackText: 'Celý Kontakt', interactiveText: 'Kontakt Form' },
    { slug: 'dobrovolnici', flag: 'PUCK_DOBROVOLNICI_RENDERER_ENABLED', interactiveId: 'volunteers-page', fallbackText: 'Celí Dobrovolníci', interactiveText: 'Dobrovolníci Form' },
    { slug: 'podporte-nas', flag: 'PUCK_PODPORA_RENDERER_ENABLED', interactiveId: 'support-page', fallbackText: 'Celá Podpora', interactiveText: 'Podpora Interactive' }
  ];

  for (const { slug, flag, fallbackId, originalText, interactiveId, fallbackText, interactiveText } of testCases) {
    describe(`Page /${slug}`, () => {
      it(`renders FALLBACK when ${flag} is OFF`, () => {
        setupFlag(flag, 'false');
        render(<PublicPortal slug={slug} onNavigate={vi.fn()} />);
        
        if (fallbackId) {
          expect(screen.getByTestId(fallbackId)).toBeInTheDocument();
          if (originalText) expect(screen.getByTestId(fallbackId)).toHaveTextContent(originalText);
        }
        if (interactiveId) {
          expect(screen.getByTestId(interactiveId)).toBeInTheDocument();
          if (fallbackText) expect(screen.getByTestId(interactiveId)).toHaveTextContent(fallbackText);
        }
        expect(screen.queryByTestId(`cms-renderer-${slug === 'podporte-nas' ? 'podpora' : slug}`)).not.toBeInTheDocument();
      });

      it(`renders PUCK CMS layout + interactive components when ${flag} is ON`, () => {
        setupFlag(flag, 'true');
        render(<PublicPortal slug={slug} onNavigate={vi.fn()} />);
        
        const rendererSlug = slug === 'podporte-nas' ? 'podpora' : slug;
        expect(screen.getByTestId(`cms-renderer-${rendererSlug}`)).toBeInTheDocument();
        
        // For hybrid pages with interactive logic
        if (interactiveId) {
          expect(screen.getByTestId(interactiveId)).toBeInTheDocument();
          expect(screen.getByTestId(interactiveId)).toHaveTextContent(interactiveText);
        }
      });
    });
  }

  it('ArticlesFeedBlock and FaqFeedBlock data exists in dbStore', () => {
    const clankyPage = dbStore.getPages(false).find(p => p.slug === 'clanky');
    expect(clankyPage).toBeDefined();
    expect(clankyPage?.content).toContain('ArticlesFeedBlock');
    
    const faqPage = dbStore.getPages(false).find(p => p.slug === 'faq');
    expect(faqPage).toBeDefined();
    expect(faqPage?.content).toContain('FaqFeedBlock');
  });
});
