import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Batch 3 Routes Migration', () => {
  it('PublicPortal contains all Batch 3 feature flags with safe fallback', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/public/PublicPortal.tsx'), 'utf-8');

    const requiredFlags = [
      'PUCK_KRIZOVA_POMOC_RENDERER_ENABLED',
      'PUCK_SOS_PLAN_RENDERER_ENABLED',
      'PUCK_FORUM_RENDERER_ENABLED',
      'PUCK_PRIBEHY_RENDERER_ENABLED',
      'PUCK_MEMENTO_RENDERER_ENABLED',
      'PUCK_PRAVNI_PORADNA_RENDERER_ENABLED',
      'PUCK_PODPORA_KOMUNITA_RENDERER_ENABLED',
      'PUCK_VIDEOTEKA_RENDERER_ENABLED',
      'PUCK_LEGAL_WIKI_RENDERER_ENABLED',
      'PUCK_STUDIE_RENDERER_ENABLED',
      'PUCK_KNIHOVNA_STUDII_RENDERER_ENABLED',
      'PUCK_VZDELAVANI_RENDERER_ENABLED'
    ];

    requiredFlags.forEach(flag => {
      expect(content.includes(flag)).toBe(true);
    });

    // Check that CmsPageRenderer is used with fallbackComponent fallback
    expect(content.includes('<CmsPageRenderer')).toBe(true);
    expect(content.includes('fallbackComponent={fallbackComponent}')).toBe(true);
  });

  it('CmsPageRenderer falls back safely on invalid Puck structure', () => {
    const cmsRendererContent = fs.readFileSync(path.resolve(__dirname, '../components/public/CmsPageRenderer.tsx'), 'utf-8');

    // Check that we're validating the structure (raw.root and raw.content array)
    expect(cmsRendererContent.includes('Array.isArray(raw.content)')).toBe(true);
    expect(cmsRendererContent.includes('raw.root')).toBe(true);

    // Check that we fallback properly when invalid or missing
    expect(cmsRendererContent.includes('if (fallbackComponent && !puckData)')).toBe(true);
    expect(cmsRendererContent.includes('return <>{fallbackComponent}</>;')).toBe(true);
  });
});
