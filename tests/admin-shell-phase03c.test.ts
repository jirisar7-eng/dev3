import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_NAV_SECTIONS,
  getVisibleAdminSections,
  findSectionByTabId,
  findItemByTabId,
  getAllAdminItems,
  resolveAdminTabFromUrl,
  AdminTabId,
} from '../src/config/adminNavigation.js';

describe('Phase 03C — Admin Shell Cleanup, Deep-Linking & UX Polish Tests', () => {
  describe('1. Deep-Linking and URL Tab Resolution', () => {
    it('should resolve direct paths to the correct AdminTabId', () => {
      assert.strictEqual(resolveAdminTabFromUrl('/admin/pages'), 'pages');
      assert.strictEqual(resolveAdminTabFromUrl('/admin/pages/new'), 'page-builder');
      assert.strictEqual(resolveAdminTabFromUrl('/admin/pages/edit/123'), 'page-builder');
      assert.strictEqual(resolveAdminTabFromUrl('/admin/analytics'), 'analytics');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace/analytika'), 'analytics');
      assert.strictEqual(resolveAdminTabFromUrl('/admin/dns'), 'dns');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace/qa'), 'qa');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace/qa/copilot'), 'qa');
      assert.strictEqual(resolveAdminTabFromUrl('/admin/copilot'), 'qa');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace/audity'), 'audits');
      assert.strictEqual(resolveAdminTabFromUrl('/admin/audit-center'), 'audits');
      assert.strictEqual(resolveAdminTabFromUrl('/admin/audit-log'), 'audit');
      assert.strictEqual(resolveAdminTabFromUrl('/admin/team-center'), 'team-center');
    });

    it('should resolve query parameter ?tab= to the correct AdminTabId', () => {
      assert.strictEqual(resolveAdminTabFromUrl('/admin?tab=copilot'), 'qa');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace?tab=users'), 'users');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace?tab=esbirka'), 'esbirka');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace?tab=audit-log'), 'audit');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace?tab=audit-center'), 'audits');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace?tab=compliance'), 'compliance');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace?tab=settings'), 'settings');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace?tab=team-center'), 'team-center');
    });

    it('should fallback to overview for unknown or root paths', () => {
      assert.strictEqual(resolveAdminTabFromUrl('/admin'), 'overview');
      assert.strictEqual(resolveAdminTabFromUrl('/administrace'), 'overview');
      assert.strictEqual(resolveAdminTabFromUrl('/'), 'overview');
      assert.strictEqual(resolveAdminTabFromUrl('/unknown-admin-path'), 'overview');
    });
  });

  describe('2. Declarative Helper Functions', () => {
    it('should return all admin items flattened with getAllAdminItems', () => {
      const items = getAllAdminItems();
      assert.ok(items.length >= 28, `Expected at least 28 items, got ${items.length}`);
      const itemIds = items.map((i) => i.id);
      assert.ok(itemIds.includes('overview'));
      assert.ok(itemIds.includes('pages'));
      assert.ok(itemIds.includes('users'));
      assert.ok(itemIds.includes('qa'));
      assert.ok(itemIds.includes('audit'));
      assert.ok(itemIds.includes('audits'));
      assert.ok(itemIds.includes('team-center'));
    });

    it('should find specific items with findItemByTabId', () => {
      const qaItem = findItemByTabId('qa');
      assert.ok(qaItem);
      assert.ok(qaItem?.title.includes('Copilot') || qaItem?.title.includes('QA'));
      assert.ok(qaItem?.keywords.includes('copilot'));

      const auditDbItem = findItemByTabId('audit');
      assert.ok(auditDbItem);
      assert.ok(auditDbItem?.title.includes('Audit Log (Provozní DB)'));

      const auditCenterItem = findItemByTabId('audits');
      assert.ok(auditCenterItem);
      assert.ok(auditCenterItem?.title.includes('Audit Center (Vývojové zprávy)'));

      const teamCenterItem = findItemByTabId('team-center');
      assert.ok(teamCenterItem);
      assert.strictEqual(teamCenterItem?.badge?.text, 'Slot');
    });
  });

  describe('3. Audit Terminology & Separation', () => {
    it('should clearly distinguish operational DB audit log from dev audit markdown center', () => {
      const secAnalytics = ADMIN_NAV_SECTIONS.find((s) => s.id === 'sec-analytics');
      assert.ok(secAnalytics);

      const auditLog = secAnalytics.items.find((i) => i.id === 'audit');
      assert.ok(auditLog, 'Must contain operational DB audit log');
      assert.ok(auditLog.badge?.text.includes('DB'));
      assert.ok(auditLog.subtitle?.includes('PostgreSQL') || auditLog.subtitle?.includes('logy'), 'Subtitle must describe DB security events');

      const auditCenter = secAnalytics.items.find((i) => i.id === 'audits');
      assert.ok(auditCenter, 'Must contain dev audit center');
      assert.ok(auditCenter.badge?.text.includes('audit') || auditCenter.badge?.text.includes('MD'));
      assert.ok(auditCenter.subtitle?.includes('docs/audit') || auditCenter.subtitle?.includes('reporty'), 'Subtitle must describe markdown development reports');
    });
  });

  describe('4. Team Center Slot Integrity', () => {
    it('should maintain Team Center as a dedicated placeholder slot in section 8', () => {
      const secTeam = ADMIN_NAV_SECTIONS.find((s) => s.id === 'sec-team');
      assert.ok(secTeam, 'Section sec-team must exist');
      assert.strictEqual(secTeam.items.length, 1);
      assert.strictEqual(secTeam.items[0].id, 'team-center');
      assert.strictEqual(secTeam.items[0].badge?.text, 'Slot');
    });
  });
});
