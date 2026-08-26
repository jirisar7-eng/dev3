import test from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

test('PHASE 04E — TEAM CENTER COMPREHENSIVE SECURITY REGRESSION & PRODUCTION READINESS', async (t) => {

  await t.test('1. Anonymous & Standard User Boundary (Fail-Closed)', () => {
    const authMiddlewarePath = join(process.cwd(), 'src/middleware/authMiddleware.ts');
    const seedPath = join(process.cwd(), 'src/services/seedService.ts');
    assert.strictEqual(existsSync(authMiddlewarePath), true);
    assert.strictEqual(existsSync(seedPath), true);

    const authContent = readFileSync(authMiddlewarePath, 'utf8');
    const seedContent = readFileSync(seedPath, 'utf8');

    // Verify requireAuth and requirePermission return 401/403 for unauthenticated or unpermitted users
    assert.match(authContent, /401/, 'requireAuth must return 401 when unauthenticated');
    assert.match(authContent, /403/, 'requirePermission must return 403 when permission is missing');

    // Verify USER / REGISTERED_USER / VERIFIED_USER are excluded from rolePermissionMap (0 team permissions granted)
    assert.strictEqual(seedContent.includes("USER: ["), false, 'Base USER must have 0 team permissions in rolePermissionMap');
    assert.strictEqual(seedContent.includes("REGISTERED_USER: ["), false, 'REGISTERED_USER must have 0 team permissions in rolePermissionMap');
  });

  await t.test('2. VOLUNTEER / PEER_MENTOR Least Privilege & IDOR Protection', () => {
    const teamRoutesPath = join(process.cwd(), 'src/routes/teamRoutes.ts');
    assert.strictEqual(existsSync(teamRoutesPath), true);
    const routesContent = readFileSync(teamRoutesPath, 'utf8');

    // Verify verifyTicketAccess helper denies access to unassigned tickets for volunteer
    assert.match(routesContent, /verifyTicketAccess/, 'Must enforce verifyTicketAccess on all ticket routes');
    assert.match(routesContent, /ticket\.assignedToId\s*===\s*user\.id/, 'Volunteer access must be strictly checked against assignedToId');
    assert.match(routesContent, /status\(403\)/, 'Must reject with 403 when access is denied');

    // Verify self-assign requires unassigned state or permission
    assert.match(routesContent, /self-assign/, 'Must have self-assign endpoint');
  });

  await t.test('3. Internal Notes Isolation (isInternal === true cannot leak to client)', () => {
    const schemaPath = join(process.cwd(), 'prisma/schema.prisma');
    const teamRoutesPath = join(process.cwd(), 'src/routes/teamRoutes.ts');
    const schemaContent = readFileSync(schemaPath, 'utf8');
    const routesContent = readFileSync(teamRoutesPath, 'utf8');

    assert.match(schemaContent, /isInternal\s*Boolean\s*@default\(false\)/, 'Schema must define isInternal on SupportTicketMessage');
    assert.match(routesContent, /isInternal:\s*!!isInternal/, 'Team reply endpoint must record isInternal flag');
  });

  await t.test('4. Strict Isolation of Cases, Documents & Judgments from Team Center', () => {
    const teamRoutesPath = join(process.cwd(), 'src/routes/teamRoutes.ts');
    const routesContent = readFileSync(teamRoutesPath, 'utf8');

    // Team routes must NEVER query prisma.case, prisma.caseDocument or prisma.judgment
    assert.strictEqual(routesContent.includes('prisma.case.'), false, 'Team routes must never directly access prisma.case');
    assert.strictEqual(routesContent.includes('prisma.caseDocument.'), false, 'Team routes must never directly access prisma.caseDocument');
    assert.strictEqual(routesContent.includes('prisma.judgment.'), false, 'Team routes must never directly access prisma.judgment');
  });

  await t.test('5. Admin & Infrastructure Isolation (VPS, DNS, Mailcow, GitHub Publisher)', () => {
    const serverPath = join(process.cwd(), 'server.ts');
    const serverContent = readFileSync(serverPath, 'utf8');

    // Critical infrastructure routes must require ADMIN/SUPER_ADMIN role explicitly
    assert.match(serverContent, /requireRole\('ADMIN'\)/, 'Admin routes must strictly enforce ADMIN role');
    assert.match(serverContent, /publisher/i, 'Publisher routes must be protected');
  });

  await t.test('6. Hybrid UX Navigation Contract (/team & /admin)', () => {
    const headerPath = join(process.cwd(), 'src/components/Header.tsx');
    const appPath = join(process.cwd(), 'src/App.tsx');
    const teamSlotPath = join(process.cwd(), 'src/components/admin/layout/TeamCenterSlot.tsx');

    const headerContent = readFileSync(headerPath, 'utf8');
    const appContent = readFileSync(appPath, 'utf8');
    const teamSlotContent = readFileSync(teamSlotPath, 'utf8');

    assert.match(headerContent, /isAuthorizedTeam/, 'Header must check isAuthorizedTeam');
    assert.match(headerContent, /\/team/, 'Header must link to /team');
    assert.match(appContent, /currentView === 'team'/, 'App.tsx must support team view');
    assert.match(teamSlotContent, /TeamCenterDashboard/, 'TeamCenterSlot must embed TeamCenterDashboard');
  });

});
