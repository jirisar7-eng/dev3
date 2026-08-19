import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 4 Routes Migration', () => {
  it('PublicPortal contains Phase 4 feature flag for o-nas with safe fallback', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/public/PublicPortal.tsx'), 'utf-8');

    // Check that PUCK_O_NAS_RENDERER_ENABLED is required
    expect(content.includes('PUCK_O_NAS_RENDERER_ENABLED')).toBe(true);

    // Check that CmsPageRenderer is used with fallbackComponent fallback for o-projektu
    expect(content.includes('<CmsPageRenderer slug="o-projektu" onNavigate={onNavigate} fallbackComponent={<AboutView onNavigate={onNavigate} />} />')).toBe(true);
  });
});
