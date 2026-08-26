import test from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

test('PHASE 04C — TEAM CENTER & GRANULAR RBAC SUITE', async (t) => {

  await t.test('1. Prisma Schema Verification: SupportTicket & SupportTicketMessage', () => {
    const schemaPath = join(process.cwd(), 'prisma/schema.prisma');
    assert.strictEqual(existsSync(schemaPath), true, 'prisma/schema.prisma must exist');
    const schemaContent = readFileSync(schemaPath, 'utf8');

    // Check SupportTicket model extensions
    assert.match(schemaContent, /model SupportTicket\s*\{[\s\S]*assignedToId\s*String\?/, 'SupportTicket must have assignedToId');
    assert.match(schemaContent, /model SupportTicket\s*\{[\s\S]*assignedAt\s*DateTime\?/, 'SupportTicket must have assignedAt');
    assert.match(schemaContent, /model SupportTicket\s*\{[\s\S]*assignedById\s*String\?/, 'SupportTicket must have assignedById');
    assert.match(schemaContent, /model SupportTicket\s*\{[\s\S]*internalNotesCount\s*Int/, 'SupportTicket must have internalNotesCount');
    assert.match(schemaContent, /model SupportTicket\s*\{[\s\S]*lastActivityAt\s*DateTime/, 'SupportTicket must have lastActivityAt');
    assert.match(schemaContent, /model SupportTicket\s*\{[\s\S]*resolvedAt\s*DateTime\?/, 'SupportTicket must have resolvedAt');

    // Check SupportTicketMessage model
    assert.match(schemaContent, /model SupportTicketMessage\s*\{[\s\S]*isInternal\s*Boolean/, 'SupportTicketMessage must have isInternal flag');

    // Check indexes
    assert.match(schemaContent, /@@index\(\[assignedToId\]\)/, 'SupportTicket must have index on assignedToId');
    assert.match(schemaContent, /@@index\(\[status,\s*assignedToId\]\)/, 'SupportTicket must have compound index on [status, assignedToId]');
  });

  await t.test('2. Granular Permissions & Role-Permission Seed Mapping', () => {
    const seedPath = join(process.cwd(), 'src/services/seedService.ts');
    assert.strictEqual(existsSync(seedPath), true, 'src/services/seedService.ts must exist');
    const seedContent = readFileSync(seedPath, 'utf8');

    // Verify Team Granular Permissions exist in seed
    const expectedPermissions = [
      'team.access',
      'team.tickets.view_assigned',
      'team.tickets.view_all',
      'team.tickets.reply',
      'team.tickets.assign',
      'team.tickets.close',
      'team.moderation.subjects',
      'team.moderation.reviews',
      'team.volunteers.view',
      'team.knowledge.view',
      'team.knowledge.edit',
    ];

    for (const perm of expectedPermissions) {
      assert.match(seedContent, new RegExp(`key:\\s*['"]${perm}['"]`), `Permission ${perm} must be defined in seedService.ts`);
    }

    // Verify VOLUNTEER least privilege
    assert.match(seedContent, /VOLUNTEER:\s*\[[\s\S]*'team\.access'[\s\S]*'team\.tickets\.view_assigned'[\s\S]*'team\.tickets\.reply'[\s\S]*'team\.knowledge\.view'/, 'VOLUNTEER must have least privilege permissions');

    // Verify VOLUNTEER does NOT have users.manage or system.logs
    const volunteerBlockMatch = seedContent.match(/VOLUNTEER:\s*\[([\s\S]*?)\]/);
    assert.ok(volunteerBlockMatch, 'VOLUNTEER mapping must exist');
    const volunteerPermissions = volunteerBlockMatch[1];
    assert.strictEqual(volunteerPermissions.includes('users.manage'), false, 'VOLUNTEER must NOT have users.manage');
    assert.strictEqual(volunteerPermissions.includes('system.logs'), false, 'VOLUNTEER must NOT have system.logs');
    assert.strictEqual(volunteerPermissions.includes('team.tickets.assign'), false, 'VOLUNTEER must NOT have team.tickets.assign');
  });

  await t.test('3. Team Center Routes & IDOR Protection Verification', () => {
    const teamRoutesPath = join(process.cwd(), 'src/routes/teamRoutes.ts');
    assert.strictEqual(existsSync(teamRoutesPath), true, 'src/routes/teamRoutes.ts must exist');
    const teamRoutesContent = readFileSync(teamRoutesPath, 'utf8');

    // Check endpoints
    assert.match(teamRoutesContent, /router\.get\('\/stats'/, 'GET /api/team/stats endpoint must exist');
    assert.match(teamRoutesContent, /router\.get\('\/tickets\/assigned'/, 'GET /api/team/tickets/assigned must exist');
    assert.match(teamRoutesContent, /router\.get\('\/tickets\/triage'/, 'GET /api/team/tickets/triage must exist');
    assert.match(teamRoutesContent, /router\.get\('\/tickets\/all'/, 'GET /api/team/tickets/all must exist');
    assert.match(teamRoutesContent, /router\.get\('\/tickets\/:id'/, 'GET /api/team/tickets/:id must exist');
    assert.match(teamRoutesContent, /router\.post\('\/tickets\/:id\/assign'/, 'POST /api/team/tickets/:id/assign must exist');
    assert.match(teamRoutesContent, /router\.post\('\/tickets\/:id\/self-assign'/, 'POST /api/team/tickets/:id/self-assign must exist');
    assert.match(teamRoutesContent, /router\.post\('\/tickets\/:id\/reply'/, 'POST /api/team/tickets/:id/reply must exist');
    assert.match(teamRoutesContent, /router\.post\('\/tickets\/:id\/status'/, 'POST /api/team/tickets/:id/status must exist');
    assert.match(teamRoutesContent, /router\.get\('\/volunteers'/, 'GET /api/team/volunteers must exist');
    assert.match(teamRoutesContent, /router\.get\('\/knowledge'/, 'GET /api/team/knowledge must exist');

    // Check IDOR verification helper
    assert.match(teamRoutesContent, /verifyTicketAccess/, 'verifyTicketAccess helper must be present for IDOR/BOLA prevention');
    assert.match(teamRoutesContent, /isInternal:\s*true/, 'Internal notes audit entries must be flagged as isInternal');
  });

  await t.test('4. Strict Case & Legal Data Isolation Guarantee', () => {
    const caseRoutesPath = join(process.cwd(), 'src/routes/caseRoutes.ts');
    assert.strictEqual(existsSync(caseRoutesPath), true, 'src/routes/caseRoutes.ts must exist');
    const caseRoutesContent = readFileSync(caseRoutesPath, 'utf8');

    // Case access must be bound to authorizeCaseAccess (no broad team bypass)
    assert.match(caseRoutesContent, /ClientCaseService\.authorizeCaseAccess/, 'Case operations must enforce strict authorizeCaseAccess per user');
    assert.match(caseRoutesContent, /ClientCaseService\.getCasesForUser/, 'Case listings must enforce getCasesForUser per user');
  });

  await t.test('5. Hybrid UI & Navigation Contract (Header + AdminDashboard + App.tsx)', () => {
    const headerPath = join(process.cwd(), 'src/components/Header.tsx');
    const appPath = join(process.cwd(), 'src/App.tsx');
    const teamSlotPath = join(process.cwd(), 'src/components/admin/layout/TeamCenterSlot.tsx');
    const teamDashboardPath = join(process.cwd(), 'src/components/team/TeamCenterDashboard.tsx');

    assert.strictEqual(existsSync(headerPath), true, 'Header.tsx must exist');
    assert.strictEqual(existsSync(appPath), true, 'App.tsx must exist');
    assert.strictEqual(existsSync(teamSlotPath), true, 'TeamCenterSlot.tsx must exist');
    assert.strictEqual(existsSync(teamDashboardPath), true, 'TeamCenterDashboard.tsx must exist');

    const headerContent = readFileSync(headerPath, 'utf8');
    const appContent = readFileSync(appPath, 'utf8');
    const teamSlotContent = readFileSync(teamSlotPath, 'utf8');

    assert.match(headerContent, /isAuthorizedTeam/, 'Header must define isAuthorizedTeam');
    assert.match(headerContent, /header-layer-team-btn/, 'Header must render layer team button');
    assert.match(headerContent, /header-user-dropdown-team/, 'Header must render team link in user dropdown');

    assert.match(appContent, /currentView === 'team'/, 'App.tsx must route team view');
    assert.match(appContent, /<TeamCenterDashboard/, 'App.tsx must render TeamCenterDashboard');

    assert.match(teamSlotContent, /<TeamCenterDashboard\s+isEmbedded=\{true\}/, 'TeamCenterSlot must embed TeamCenterDashboard');
  });

});
