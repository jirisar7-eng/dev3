import { describe, it, expect } from 'vitest';
import { ProjectControlService, PORTAL_CONTENT_CATALOG, AUDIT_RECOMMENDATIONS_CATALOG, PROJECT_PHASES_CATALOG } from '../src/services/projectControlService';
import { ADMIN_NAV_SECTIONS, resolveAdminTabFromUrl } from '../src/config/adminNavigation';

describe('Phase 19: Content & Project Control Center Integration & Security', () => {
  it('should resolve project-control tab from URL correctly', () => {
    expect(resolveAdminTabFromUrl('/admin/project-control')).toBe('project-control');
    expect(resolveAdminTabFromUrl('/administrace?tab=project-control')).toBe('project-control');
    expect(resolveAdminTabFromUrl('/admin/obsah-projekt')).toBe('project-control');
  });

  it('should include project-control in ADMIN_NAV_SECTIONS under Obsah & CMS', () => {
    const cmsSection = ADMIN_NAV_SECTIONS.find((s) => s.id === 'sec-cms');
    expect(cmsSection).toBeDefined();

    const controlItem = cmsSection?.items.find((i) => i.id === 'project-control');
    expect(controlItem).toBeDefined();
    expect(controlItem?.title).toBe('Obsah & Projekt');
    expect(controlItem?.path).toBe('/admin/project-control');
    expect(controlItem?.badge?.text).toBe('Control Center');
  });

  it('should return complete overview metrics with all 6 unified states', async () => {
    const overview = await ProjectControlService.getOverview();

    expect(overview).toBeDefined();
    expect(overview.counts).toBeDefined();
    expect(overview.counts.DONE).toBeGreaterThanOrEqual(0);
    expect(overview.counts.IN_PROGRESS).toBeGreaterThanOrEqual(0);
    expect(overview.counts.PLANNED).toBeGreaterThanOrEqual(0);
    expect(overview.counts.IDEA).toBeGreaterThanOrEqual(0);
    expect(overview.counts.BLOCKED).toBeGreaterThanOrEqual(0);
    expect(overview.counts.ARCHIVED).toBeGreaterThanOrEqual(0);

    expect(overview.totalContentItems).toBe(PORTAL_CONTENT_CATALOG.length);
    expect(overview.totalRecommendations).toBe(AUDIT_RECOMMENDATIONS_CATALOG.length);
    expect(overview.totalPhasesCount).toBe(PROJECT_PHASES_CATALOG.length);
    expect(overview.systemHealth.status).toBe('OK');
  });

  it('should return verified portal content catalog without fake data', () => {
    const catalog = ProjectControlService.getContentCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(10);

    const vyzivne = catalog.find((c) => c.path === '/kalkulacka-vyzivneho');
    expect(vyzivne).toBeDefined();
    expect(vyzivne?.completenessPercent).toBe(100);
    expect(vyzivne?.status).toBe('DONE');

    const ospod = catalog.find((c) => c.path === '/mapa-pomoci');
    expect(ospod).toBeDefined();
    expect(ospod?.status).toBe('DONE');
  });

  it('should filter content catalog by search query', () => {
    const results = ProjectControlService.getContentCatalog({ search: 'judikatura' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.title.toLowerCase().includes('judikatura'))).toBe(true);
  });

  it('should return audit recommendations from phases 13-18', () => {
    const recs = ProjectControlService.getAuditRecommendations();
    expect(recs.length).toBeGreaterThanOrEqual(5);

    const phase15Rec = recs.find((r) => r.phase === 'Fáze 15');
    expect(phase15Rec).toBeDefined();
    expect(phase15Rec?.priority).toBe('P0_CRITICAL');
  });

  it('should allow creating, updating, and deleting project backlog tasks', async () => {
    const testUser = { id: 'usr-admin-test', email: 'admin@tatamapravo.cz', role: 'ADMIN', name: 'Hlavní Administrátor' };

    // 1. Create task
    const created = await ProjectControlService.createTask(
      {
        title: 'Testovací úkol pro Fázi 19',
        description: 'Ověření CRUD operací v Control Center',
        status: 'IDEA',
        priority: 'P1_HIGH',
        category: 'CONTENT',
        assignedToName: 'QA Tým',
        notes: 'Integrační testovací poznámka',
      },
      testUser,
      '127.0.0.1'
    );

    expect(created).toBeDefined();
    expect(created.title).toBe('Testovací úkol pro Fázi 19');
    expect(created.status).toBe('IDEA');
    expect(created.priority).toBe('P1_HIGH');

    // 2. Update status to IN_PROGRESS then DONE
    const updated = await ProjectControlService.updateTask(
      created.id,
      {
        status: 'DONE',
        notes: 'Hotovo v testu',
      },
      testUser,
      '127.0.0.1'
    );

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('DONE');

    // 3. Delete task
    const deleted = await ProjectControlService.deleteTask(created.id, testUser, '127.0.0.1');
    expect(deleted).toBe(true);
  });
});
