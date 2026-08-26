import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_NAV_SECTIONS,
  getVisibleAdminSections,
  findSectionByTabId,
  AdminTabId,
} from '../src/config/adminNavigation.js';

describe('Phase 03B — Admin Shell Information Architecture & RBAC Tests', () => {
  it('should define exactly 8 main logical sections', () => {
    assert.strictEqual(ADMIN_NAV_SECTIONS.length, 8);
    const sectionIds = ADMIN_NAV_SECTIONS.map((s) => s.id);
    assert.deepStrictEqual(sectionIds, [
      'sec-overview',
      'sec-cms',
      'sec-users',
      'sec-legal',
      'sec-ai',
      'sec-analytics',
      'sec-system',
      'sec-team',
    ]);
  });

  it('should include all required 28+ original admin functions and the Team Center slot', () => {
    const allTabIds: AdminTabId[] = [];
    for (const section of ADMIN_NAV_SECTIONS) {
      for (const item of section.items) {
        allTabIds.push(item.id);
      }
    }

    const expectedTabs: AdminTabId[] = [
      'overview',
      'pages',
      'templates',
      'texts',
      'theme',
      'branding',
      'custom-modules',
      'cms',
      'users',
      'esbirka',
      'state-admin',
      'subjekty',
      'schvalovani-kontaktu',
      'ai-context',
      'qa',
      'tests',
      'analytics',
      'audit',
      'audits',
      'compliance',
      'sponsors',
      'settings',
      'modules',
      'mailcow',
      'dns',
      'vps',
      'github',
      'team-center',
    ];

    for (const tab of expectedTabs) {
      assert.ok(
        allTabIds.includes(tab),
        `Admin Shell must include tab: ${tab}`
      );
    }
  });

  it('should enforce SUPER_ADMIN role for sensitive system tools (VPS, GitHub Publisher)', () => {
    const superAdminSections = getVisibleAdminSections('SUPER_ADMIN');
    const systemSectionSuper = superAdminSections.find((s) => s.id === 'sec-system');
    assert.ok(systemSectionSuper);
    const vpsItemSuper = systemSectionSuper.items.find((i) => i.id === 'vps');
    const githubItemSuper = systemSectionSuper.items.find((i) => i.id === 'github');
    assert.ok(vpsItemSuper, 'SUPER_ADMIN must see VPS item');
    assert.ok(githubItemSuper, 'SUPER_ADMIN must see GitHub Publisher item');

    const adminSections = getVisibleAdminSections('ADMIN');
    const systemSectionAdmin = adminSections.find((s) => s.id === 'sec-system');
    assert.ok(systemSectionAdmin);
    const vpsItemAdmin = systemSectionAdmin.items.find((i) => i.id === 'vps');
    const githubItemAdmin = systemSectionAdmin.items.find((i) => i.id === 'github');
    assert.strictEqual(vpsItemAdmin, undefined, 'ADMIN must NOT see VPS item');
    assert.strictEqual(githubItemAdmin, undefined, 'ADMIN must NOT see GitHub Publisher item');
  });

  it('should restrict unauthorized roles (USER, REGISTERED_USER) from accessing admin sections', () => {
    const userSections = getVisibleAdminSections('USER');
    assert.strictEqual(userSections.length, 0, 'Standard USER must have 0 visible admin sections');

    const undefinedSections = getVisibleAdminSections(undefined);
    assert.strictEqual(undefinedSections.length, 0, 'Unauthenticated user must have 0 visible admin sections');
  });

  it('should allow granular access for CONTENT_MANAGER, LEGAL_EDITOR, MODERATOR', () => {
    const contentManagerSections = getVisibleAdminSections('CONTENT_MANAGER');
    assert.strictEqual(contentManagerSections.length, 1);
    assert.strictEqual(contentManagerSections[0].id, 'sec-cms');

    const legalEditorSections = getVisibleAdminSections('LEGAL_EDITOR');
    const legalSectionIds = legalEditorSections.map((s) => s.id);
    assert.ok(legalSectionIds.includes('sec-legal'));

    const moderatorSections = getVisibleAdminSections('MODERATOR');
    assert.strictEqual(moderatorSections.length, 1);
    assert.strictEqual(moderatorSections[0].id, 'sec-legal');
    const moderatorItemIds = moderatorSections[0].items.map((i) => i.id);
    assert.ok(moderatorItemIds.includes('subjekty'));
    assert.ok(moderatorItemIds.includes('schvalovani-kontaktu'));
    assert.strictEqual(moderatorItemIds.includes('esbirka'), false);
  });

  it('should correctly map any tab ID to its parent section with findSectionByTabId', () => {
    assert.strictEqual(findSectionByTabId('overview'), 'sec-overview');
    assert.strictEqual(findSectionByTabId('pages'), 'sec-cms');
    assert.strictEqual(findSectionByTabId('texts'), 'sec-cms');
    assert.strictEqual(findSectionByTabId('users'), 'sec-users');
    assert.strictEqual(findSectionByTabId('esbirka'), 'sec-legal');
    assert.strictEqual(findSectionByTabId('ai-context'), 'sec-ai');
    assert.strictEqual(findSectionByTabId('analytics'), 'sec-analytics');
    assert.strictEqual(findSectionByTabId('dns'), 'sec-system');
    assert.strictEqual(findSectionByTabId('team-center'), 'sec-team');
  });

  it('should have searchable keywords on every navigation item', () => {
    for (const section of ADMIN_NAV_SECTIONS) {
      for (const item of section.items) {
        assert.ok(
          Array.isArray(item.keywords) && item.keywords.length > 0,
          `Item ${item.id} must have searchable keywords`
        );
      }
    }
  });

  it('should maintain Team Center slot as an architectural placeholder without fake roles', () => {
    const teamSection = ADMIN_NAV_SECTIONS.find((s) => s.id === 'sec-team');
    assert.ok(teamSection, 'Team Center section must exist');
    assert.strictEqual(teamSection.items.length, 1);
    assert.strictEqual(teamSection.items[0].id, 'team-center');
    assert.strictEqual(teamSection.items[0].badge?.text, 'Slot');
  });
});
