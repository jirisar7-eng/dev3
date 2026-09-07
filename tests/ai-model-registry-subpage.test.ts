import { describe, it, expect } from 'vitest';
import { resolveAdminTabFromUrl } from '../src/config/adminNavigation';
import { getTabFromPath } from '../src/components/admin/ai/AiModelControlCenter';

describe('AI Model Registry Subpage & URL Routing', () => {
  describe('resolveAdminTabFromUrl', () => {
    it('should resolve /administrace/ai-control-center to ai-control-center', () => {
      expect(resolveAdminTabFromUrl('/administrace/ai-control-center')).toBe('ai-control-center');
    });

    it('should resolve canonical subpage /administrace/ai-control-center/models to ai-control-center', () => {
      expect(resolveAdminTabFromUrl('/administrace/ai-control-center/models')).toBe('ai-control-center');
    });

    it('should resolve other subpages to ai-control-center', () => {
      expect(resolveAdminTabFromUrl('/administrace/ai-control-center/providers')).toBe('ai-control-center');
      expect(resolveAdminTabFromUrl('/administrace/ai-control-center/routing')).toBe('ai-control-center');
      expect(resolveAdminTabFromUrl('/administrace/ai-control-center/policy')).toBe('ai-control-center');
      expect(resolveAdminTabFromUrl('/administrace/ai-control-center/roles')).toBe('ai-control-center');
      expect(resolveAdminTabFromUrl('/administrace/ai-control-center/council')).toBe('ai-control-center');
      expect(resolveAdminTabFromUrl('/administrace/ai-control-center/telemetry')).toBe('ai-control-center');
    });

    it('should resolve query param tab=ai-control-center to ai-control-center', () => {
      expect(resolveAdminTabFromUrl('/admin?tab=ai-control-center')).toBe('ai-control-center');
    });
  });

  describe('AiModelControlCenter.getTabFromPath', () => {
    it('should resolve /administrace/ai-control-center/models to models tab', () => {
      expect(getTabFromPath('/administrace/ai-control-center/models')).toBe('models');
    });

    it('should resolve default path /administrace/ai-control-center to providers tab', () => {
      expect(getTabFromPath('/administrace/ai-control-center')).toBe('providers');
    });

    it('should resolve each specific subtab correctly', () => {
      expect(getTabFromPath('/administrace/ai-control-center/providers')).toBe('providers');
      expect(getTabFromPath('/administrace/ai-control-center/routing')).toBe('routing');
      expect(getTabFromPath('/administrace/ai-control-center/policy')).toBe('policy');
      expect(getTabFromPath('/administrace/ai-control-center/roles')).toBe('roles');
      expect(getTabFromPath('/administrace/ai-control-center/council')).toBe('council');
      expect(getTabFromPath('/administrace/ai-control-center/telemetry')).toBe('telemetry');
    });

    it('should support query params and hash fallback', () => {
      expect(getTabFromPath('/administrace/ai-control-center?tab=models')).toBe('models');
      expect(getTabFromPath('/administrace/ai-control-center#models')).toBe('models');
      expect(getTabFromPath('/administrace/ai-control-center?subtab=council')).toBe('council');
    });

    it('should fallback to providers when path is empty or unknown', () => {
      expect(getTabFromPath('')).toBe('providers');
      expect(getTabFromPath('/administrace/ai-control-center/unknown')).toBe('providers');
    });
  });
});
