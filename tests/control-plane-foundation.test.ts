import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ControlPlaneService } from '../src/services/controlPlaneService';
import { AuditService } from '../src/services/auditService';
import { User } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Mock dependencies
vi.mock('../src/services/auditService', () => ({
  AuditService: {
    recordLog: vi.fn().mockResolvedValue({ id: 'mock-audit-id' })
  }
}));

describe('Project Control Plane Foundation', () => {
  const mockSuperAdmin: User = { id: '1', email: 'super@test.com', role: 'SUPER_ADMIN' } as any;
  const mockAdmin: User = { id: '2', email: 'admin@test.com', role: 'ADMIN' } as any;
  const mockContentMgr: User = { id: '3', email: 'cm@test.com', role: 'CONTENT_MANAGER' } as any;
  const mockUser: User = { id: '4', email: 'user@test.com', role: 'USER' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Use a fresh map for tests, but since it's static we can reset it by clearing file or manipulating private fields
    (ControlPlaneService as any).actions = new Map();
    (ControlPlaneService as any).initialized = true; // prevent file read
  });

  describe('Dry Run & Intent Analysis', () => {
    it('analyzes READ_ONLY intent correctly', () => {
      const result = ControlPlaneService.analyzeIntent('jaký je stav databáze?');
      expect(result.willMutate).toBe(false);
      expect(result.requiredApproval).toBe('READ_ONLY');
      expect(result.requiredPermissions).toContain('USER');
    });

    it('analyzes SAFE_MUTATION for CMS updates', () => {
      const result = ControlPlaneService.analyzeIntent('update article o soudech');
      expect(result.willMutate).toBe(true);
      expect(result.riskLevel).toBe('P2');
      expect(result.requiredApproval).toBe('SAFE_MUTATION');
      expect(result.requiredPermissions).toContain('CONTENT_MANAGER');
    });

    it('analyzes CRITICAL_MUTATION for database or deploy', () => {
      const res1 = ControlPlaneService.analyzeIntent('deploy to production');
      expect(res1.riskLevel).toBe('P0');
      expect(res1.requiredApproval).toBe('CRITICAL_MUTATION');
      expect(res1.requiredPermissions).toContain('SUPER_ADMIN');
      
      const res2 = ControlPlaneService.analyzeIntent('změnit rbac role');
      expect(res2.riskLevel).toBe('P1');
      expect(res2.requiredApproval).toBe('CRITICAL_MUTATION');
      expect(res2.requiredPermissions).toContain('ADMIN');
    });
  });

  describe('RBAC & Permission Denial (Fail Closed)', () => {
    it('denies USER from executing SAFE_MUTATION', async () => {
      await expect(
        ControlPlaneService.createAction(mockUser, 'update article', {})
      ).rejects.toThrow('Nemáte dostatečná oprávnění');
      expect(AuditService.recordLog).toHaveBeenCalledWith(
        'CONTROL_PLANE_FAILED',
        expect.any(String),
        expect.stringContaining('RBAC Odepřeno'),
        mockUser,
        expect.any(String)
      );
    });

    it('denies ADMIN from executing CRITICAL P0 mutation', async () => {
      await expect(
        ControlPlaneService.createAction(mockAdmin, 'smazat databázi deploy', {})
      ).rejects.toThrow('Nemáte dostatečná oprávnění');
    });

    it('allows SUPER_ADMIN to execute anything', async () => {
      const action = await ControlPlaneService.createAction(mockSuperAdmin, 'smazat databázi deploy', {});
      expect(action.id).toBeDefined();
    });
  });

  describe('Snapshot Creation & Backup', () => {
    it('preserves original state securely in a 48h snapshot', async () => {
      const action = await ControlPlaneService.createAction(mockContentMgr, 'update faq', {});
      
      const originalData = { title: 'Old FAQ', content: 'Old Content' };
      await ControlPlaneService.createSnapshot(mockContentMgr, action.id, originalData);
      
      const updatedAction = ControlPlaneService.getAction(action.id)!;
      expect(updatedAction.backupReference).toBeDefined();
      
      // Because it's a SAFE_MUTATION, creating snapshot auto-approves it
      expect(updatedAction.status).toBe('APPROVED');
      
      const snapshotPath = path.join(process.cwd(), 'control-plane-snapshots', `${updatedAction.backupReference}.json`);
      expect(fs.existsSync(snapshotPath)).toBe(true);
      
      // Cleanup
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    });

    it('sets AWAITING_APPROVAL for SENSITIVE_MUTATION after snapshot', async () => {
      const action = await ControlPlaneService.createAction(mockAdmin, 'delete data', {});
      await ControlPlaneService.createSnapshot(mockAdmin, action.id, { dummy: true });
      
      const updatedAction = ControlPlaneService.getAction(action.id)!;
      expect(updatedAction.status).toBe('AWAITING_APPROVAL');
      
      const snapshotPath = path.join(process.cwd(), 'control-plane-snapshots', `${updatedAction.backupReference}.json`);
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    });
  });

  describe('Approval Gates', () => {
    it('denies USER and CONTENT_MANAGER from approving sensitive actions', async () => {
      const action = await ControlPlaneService.createAction(mockAdmin, 'delete data', {});
      await ControlPlaneService.createSnapshot(mockAdmin, action.id, {});
      
      await expect(ControlPlaneService.approveAction(mockContentMgr, action.id)).rejects.toThrow('Nedostatečná oprávnění ke schválení akce');
    });

    it('allows SUPER_ADMIN to approve CRITICAL mutations', async () => {
      const action = await ControlPlaneService.createAction(mockSuperAdmin, 'deploy to production', {});
      await ControlPlaneService.createSnapshot(mockSuperAdmin, action.id, {});
      
      await ControlPlaneService.approveAction(mockSuperAdmin, action.id);
      expect(ControlPlaneService.getAction(action.id)!.status).toBe('APPROVED');
    });

    it('prevents execution of unapproved actions', async () => {
      const action = await ControlPlaneService.createAction(mockAdmin, 'delete data', {});
      await expect(ControlPlaneService.completeAction(mockAdmin, action.id)).rejects.toThrow('nebyla schválena');
    });
  });

  describe('Rollback & Expiration', () => {
    it('restores state correctly via rollback', async () => {
      const action = await ControlPlaneService.createAction(mockAdmin, 'update setting', {});
      const originalData = { config: 'old' };
      await ControlPlaneService.createSnapshot(mockAdmin, action.id, originalData);
      
      const rollbackData = await ControlPlaneService.rollbackAction(mockAdmin, action.id);
      expect(rollbackData).toEqual(originalData);
      
      expect(ControlPlaneService.getAction(action.id)!.status).toBe('ROLLED_BACK');
      
      const snapshotPath = path.join(process.cwd(), 'control-plane-snapshots', `${ControlPlaneService.getAction(action.id)!.backupReference}.json`);
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    });

    it('blocks rollback if 48h has expired', async () => {
      const action = await ControlPlaneService.createAction(mockAdmin, 'update setting', {});
      await ControlPlaneService.createSnapshot(mockAdmin, action.id, { test: 1 });
      
      // Simulate time expiration
      action.expiresAt = new Date(Date.now() - 1000);
      
      await expect(ControlPlaneService.rollbackAction(mockAdmin, action.id)).rejects.toThrow('vypršel (48h limit)');
      
      const snapshotPath = path.join(process.cwd(), 'control-plane-snapshots', `${action.backupReference}.json`);
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    });
  });

  describe('Audit Trail & Secret Redaction', () => {
    it('records logs with appropriate action types', async () => {
      const action = await ControlPlaneService.createAction(mockContentMgr, 'update news', {});
      expect(AuditService.recordLog).toHaveBeenCalledWith('CONTROL_PLANE_PLAN_CREATED', expect.any(String), expect.any(String), mockContentMgr, expect.any(String));
      
      await ControlPlaneService.createSnapshot(mockContentMgr, action.id, {});
      expect(AuditService.recordLog).toHaveBeenCalledWith('CONTROL_PLANE_BACKUP_CREATED', expect.any(String), expect.any(String), mockContentMgr, expect.any(String));
    });
  });
});
